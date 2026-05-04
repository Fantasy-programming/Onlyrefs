use fxhash::FxHashMap;
use image::{imageops, DynamicImage, GenericImageView, RgbaImage};
use kmeans_colors::{get_kmeans, get_kmeans_hamerly, Calculate, Kmeans, MapColor, Sort};
use palette::cast::{AsComponents, ComponentsAs};
use palette::{white_point::D65, Alpha, FromColor, IntoColor, Lab, LinSrgba, Srgb, Srgba};
use psd::Psd;

use mime_guess::from_path;
use std::collections::HashSet;
use std::path::{Path, PathBuf};

use crate::utils::cached_srgba_to_lab;

// Constants for image processing
const COLOR_EXTRACTION_SIZE: u32 = 150;
const DEFAULT_COLORS_AMOUNT: usize = 6;
const DEFAULT_MAX_ITERATIONS: usize = 10;
const DEFAULT_CONVERGE: f32 = 8.0;
const DEFAULT_SEED: u64 = 0;

/// Determine the media type of a file based on its extension
pub fn determine_media_type<P>(file_path: P) -> String
where
    P: AsRef<Path>,
{
    if let Some(media_type) = from_path(file_path).first() {
        media_type.to_string()
    } else {
        "application/octet-stream".to_string()
    }
}

/// Get the dimensions of an image (width, height)
pub fn analyze_dimensions(file_path: &Path) -> Option<(u32, u32)> {
    image::open(file_path).ok().map(|img| img.dimensions())
}

/// Extract the colors from an image
pub fn extract_colors(file_path: &Path) -> Vec<String> {
    let media_type = determine_media_type(file_path);

    if media_type.contains("video") {
        return Vec::new();
    }

    // Try to open the image, return empty colors if it fails
    let img = match image::open(file_path) {
        Ok(img) => img,
        Err(e) => {
            eprintln!(
                "Failed to open image for color extraction: {:?} - {}",
                file_path, e
            );
            return Vec::new();
        }
    };

    let mut lab_cache = FxHashMap::default();
    let mut lab_pixels: Vec<Lab<D65, f32>> = Vec::new();

    let resized = img.resize(
        COLOR_EXTRACTION_SIZE,
        COLOR_EXTRACTION_SIZE,
        image::imageops::Triangle,
    );

    // Convert to RGBA8 to ensure 4 bytes per pixel
    let raw_img = resized.into_rgba8();
    let raw_data = raw_img.as_raw();
    
    // Safely convert to Srgba slice - check that length is divisible by 4
    if raw_data.len() % 4 != 0 {
        eprintln!("Image data length not divisible by 4: {}", raw_data.len());
        return Vec::new();
    }
    
    let pixels: &[Srgba<u8>] = raw_data.components_as();

    lab_pixels.clear();
    cached_srgba_to_lab(pixels.iter(), &mut lab_cache, &mut lab_pixels);

    let result = get_kmeans_hamerly(
        DEFAULT_COLORS_AMOUNT,
        DEFAULT_MAX_ITERATIONS,
        DEFAULT_CONVERGE,
        false, // verbose
        &lab_pixels,
        DEFAULT_SEED,
    );

    let mut res = Lab::<D65, f32>::sort_indexed_colors(&result.centroids, &result.indices);
    res.sort_unstable_by(|a, b| (b.percentage).total_cmp(&a.percentage));
    res.iter()
        .map(|r| {
            let c: Srgb<u8> = Srgb::from_color(r.centroid).into_format();
            format!("#{:02x}{:02x}{:02x}", c.red, c.green, c.blue)
        })
        .collect()
}

/// Generate a lower quality image
pub fn generate_image(
    file_name: &str,
    file_dir: &Path,
    height: u32,
    width: u32,
    target_size_kb: u32,
) -> bool {
    // If the file is a gif or video stop the process
    let media_type = determine_media_type(file_name);
    let file_path = file_dir.join(file_name);

    if media_type.contains("gif") || media_type.contains("video") {
        return false;
    }

    // Try to open the image, return false if it fails
    let image_data = match image::open(&file_path) {
        Ok(img) => img,
        Err(e) => {
            eprintln!(
                "Failed to open image for thumbnail generation: {:?} - {}",
                file_path, e
            );
            return false;
        }
    };

    // Resize the image
    let resized = image_data.resize(width, height, image::imageops::FilterType::Lanczos3);

    // Apply quality reduction if needed
    let final_image = if should_reduce_quality(&resized, target_size_kb) {
        reduce_image_quality(resized, target_size_kb)
    } else {
        resized
    };

    // Save the thumbnail
    let dest_file_name = format!("lower_{}", file_name);
    let dest_file_path = file_dir.join(dest_file_name);

    match final_image.save(&dest_file_path) {
        Ok(_) => true,
        Err(e) => {
            eprintln!("Failed to save thumbnail: {:?} - {}", dest_file_path, e);
            false
        }
    }
}

/// Check if image needs quality reduction based on estimated size
fn should_reduce_quality(image: &DynamicImage, target_size_kb: u32) -> bool {
    let target_size_bytes = target_size_kb * 1024;
    let estimated_size = image.width() * image.height() * 4; // RGBA
    estimated_size > target_size_bytes
}

/// Reduce image quality by resizing to meet target size
fn reduce_image_quality(image: DynamicImage, target_size_kb: u32) -> DynamicImage {
    let target_size_bytes = target_size_kb * 1024;
    let current_size_bytes = image.width() * image.height() * 4;

    if current_size_bytes <= target_size_bytes {
        return image;
    }

    let quality_factor = ((target_size_bytes as f64) / (current_size_bytes as f64)).sqrt();
    let new_width = ((quality_factor * image.width() as f64) as u32).max(1);
    let new_height = ((quality_factor * image.height() as f64) as u32).max(1);

    image.resize_exact(
        new_width,
        new_height,
        image::imageops::FilterType::CatmullRom,
    )
}

// ============================================
// PSD/Design File Support
// ============================================

/// Information extracted from a PSD file
pub struct PsdInfo {
    pub dimensions: Option<(u32, u32)>,
    pub layer_count: Option<u32>,
    pub color_mode: Option<String>,
}

/// Extract metadata from a PSD file
pub fn extract_psd_info(file_path: &Path) -> Result<PsdInfo, String> {
    let psd_bytes = std::fs::read(file_path)
        .map_err(|e| format!("Failed to read PSD file: {}", e))?;
    
    let psd = Psd::from_bytes(&psd_bytes)
        .map_err(|e| format!("Failed to parse PSD file: {}", e))?;
    
    let color_mode = match psd.color_mode() {
        psd::ColorMode::Bitmap => "Bitmap",
        psd::ColorMode::Grayscale => "Grayscale",
        psd::ColorMode::Indexed => "Indexed",
        psd::ColorMode::Rgb => "RGB",
        psd::ColorMode::Cmyk => "CMYK",
        psd::ColorMode::Multichannel => "Multichannel",
        psd::ColorMode::Duotone => "Duotone",
        psd::ColorMode::Lab => "Lab",
    };
    
    Ok(PsdInfo {
        dimensions: Some((psd.width(), psd.height())),
        layer_count: Some(psd.layers().len() as u32),
        color_mode: Some(color_mode.to_string()),
    })
}

/// Generate a thumbnail from a PSD file
pub fn generate_psd_thumbnail(file_name: &str, file_dir: &Path, psd_path: &Path) -> bool {
    let psd_bytes = match std::fs::read(psd_path) {
        Ok(bytes) => bytes,
        Err(e) => {
            eprintln!("Failed to read PSD file for thumbnail: {:?} - {}", psd_path, e);
            return false;
        }
    };
    
    let psd = match Psd::from_bytes(&psd_bytes) {
        Ok(psd) => psd,
        Err(e) => {
            eprintln!("Failed to parse PSD file for thumbnail: {:?} - {}", psd_path, e);
            return false;
        }
    };
    
    // Get the flattened composite image as RGBA
    let rgba = psd.rgba();
    let width = psd.width();
    let height = psd.height();
    
    // Create image from raw RGBA data
    let img = match RgbaImage::from_raw(width, height, rgba) {
        Some(img) => DynamicImage::ImageRgba8(img),
        None => {
            eprintln!("Failed to create image from PSD RGBA data");
            return false;
        }
    };
    
    // Resize for thumbnail (max 500x500)
    let resized = img.resize(500, 500, image::imageops::FilterType::Lanczos3);
    
    // Save thumbnail
    let thumbnail_name = format!("thumbnail_{}.png", file_name);
    let thumbnail_path = file_dir.join(thumbnail_name);
    
    match resized.save(&thumbnail_path) {
        Ok(_) => true,
        Err(e) => {
            eprintln!("Failed to save PSD thumbnail: {:?} - {}", thumbnail_path, e);
            false
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::Path;

    const IMAGE_PATH: &str = "resources/test_image.png";
    const VIDEO_PATH: &str = "resources/test_video.mp4";
    const GIF_PATH: &str = "resources/test_gif.gif";

    #[test]
    fn test_determine_media_type() {
        assert_eq!(determine_media_type("image.jpg"), "image/jpeg");
        assert_eq!(determine_media_type("video.mp4"), "video/mp4");
        assert_eq!(
            determine_media_type("unknown.file"),
            "application/octet-stream"
        );
    }

    #[test]
    fn test_analyze_dimensions() {
        let file_path = Path::new("test_image.jpg");
        let image_path = Path::new(IMAGE_PATH);
        let video_path = Path::new(VIDEO_PATH);
        let gif_path = Path::new(GIF_PATH);

        // Create a file with 0 bytes with no dimensions
        fs::write(file_path, [0u8; 100]).expect("Failed to create test file");
        let dimensions = analyze_dimensions(file_path);
        assert!(dimensions.is_none());
        fs::remove_file(file_path).expect("Failed to delete test file");

        // Analyze dimensions from various files
        let png_dimensions = analyze_dimensions(image_path).expect("Failed to get dimensions");
        let gif_dimensions = analyze_dimensions(gif_path).expect("Failed to get dimensions");
        let video_dimensions = analyze_dimensions(video_path);

        assert_eq!(png_dimensions, (1200, 900));
        assert_eq!(gif_dimensions, (2000, 1500));
        assert!(video_dimensions.is_none());
    }

    #[test]
    fn test_extract_colors() {
        let image_path = Path::new(IMAGE_PATH);
        let video_path = Path::new(VIDEO_PATH);
        let gif_path = Path::new(GIF_PATH);

        let colors = extract_colors(image_path);
        assert!(!colors.is_empty());

        let colors = extract_colors(gif_path);
        assert!(!colors.is_empty());

        let colors = extract_colors(video_path);
        assert!(colors.is_empty());
    }

    #[test]
    fn test_generate_image() {
        // Create a destination directory
        let base_path = Path::new("generated");
        fs::create_dir_all(base_path).expect("Failed to create destination directory");
        let _ = fs::copy(IMAGE_PATH, base_path.join("test_image.png"));

        // Generate a lower quality image
        let result = generate_image("test_image.png", base_path, 200, 200, 50);
        assert!(result);

        // Check if the file was generated
        let generated_file_path = base_path.join("lower_test_image.png");
        assert!(generated_file_path.exists());

        // Clean up the generated file
        fs::remove_dir_all(base_path).expect("Failed to delete destination directory");
    }
}

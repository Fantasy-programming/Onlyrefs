use fxhash::FxHashMap;
use image::{imageops, DynamicImage, GenericImageView, RgbaImage};
use kmeans_colors::{get_kmeans, get_kmeans_hamerly, Calculate, Kmeans, MapColor, Sort};
use palette::cast::{AsComponents, ComponentsAs};
use palette::{white_point::D65, Alpha, FromColor, IntoColor, Lab, LinSrgba, Srgb, Srgba};

use mime_guess::from_path;
use std::collections::HashSet;
use std::path::{Path, PathBuf};

use crate::utils::cached_srgba_to_lab;

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
    if let Ok(image) = image::open(file_path) {
        Some(image.dimensions())
    } else {
        None
    }
}

/// Extract the colors from an image
pub fn extract_colors(file_path: &Path) -> Vec<String> {
    let media_type = determine_media_type(file_path);

    if media_type.contains("video") {
        return Vec::new();
    }

    let mut lab_cache = FxHashMap::default();
    let mut lab_pixels: Vec<Lab<D65, f32>> = Vec::new();

    let img = image::open(file_path).unwrap();
    img.resize(150, 150, image::imageops::Triangle);
    let raw_img = img.into_rgb8();
    let pixels: &[Srgba<u8>] = raw_img.as_raw().components_as();

    lab_pixels.clear();
    cached_srgba_to_lab(pixels.iter(), &mut lab_cache, &mut lab_pixels);

    let mut result = Kmeans::new();
    let colors_amount = 8;
    let max_iterations = 20;
    let converge = 10.0;
    let verbose = false;
    let run = 3;
    let seed: u64 = 0;

    for i in 0..run {
        let run_result = get_kmeans_hamerly(
            colors_amount,
            max_iterations,
            converge,
            verbose,
            &lab_pixels,
            seed + i,
        );
        if run_result.score < result.score {
            result = run_result;
        }
    }

    let mut res = Lab::<D65, f32>::sort_indexed_colors(&result.centroids, &result.indices);
    res.sort_unstable_by(|a, b| (b.percentage).total_cmp(&a.percentage));

    let mut hex_colors = Vec::new();
    for r in res.iter() {
        let c: Srgb<u8> = Srgb::from_color(r.centroid).into_format();
        let hex_str = format!("#{:02x}{:02x}{:02x}", c.red, c.green, c.blue);
        hex_colors.push(hex_str);
    }

    hex_colors
}

/// Generate a lower quality image
pub fn generate_image(
    file_name: &str,
    file_dir: &Path,
    height: u32,
    width: u32,
    target_size: u32,
) -> bool {
    // If the file is a gif or video stop the process
    let media_type = determine_media_type(file_name);
    let file_path = file_dir.join(file_name);

    if media_type.contains("gif") || media_type.contains("video") {
        return false;
    }

    // Open and resize the image (First)
    let image_data = image::open(file_path).expect("Failed to open image");
    let image_data = image_data.resize(height, width, image::imageops::FilterType::Lanczos3);
    let image_data = RgbaImage::from(image_data.to_rgba8());

    // Lower the image quality (Second)
    reduce_image_quality(&image_data, target_size);
    let new_image = DynamicImage::ImageRgba8(image_data);

    // Save into filename_lower
    let dest_file_name = format!("lower_{}", file_name);
    let dest_file_path = file_dir.join(dest_file_name);

    new_image
        .save(dest_file_path)
        .expect("Failed to save image");

    true
}

fn reduce_image_quality(rgba_image: &RgbaImage, target_size_kb: u32) {
    let target_size_bytes = target_size_kb * 1024;
    let current_size_bytes = rgba_image.dimensions().0 * rgba_image.dimensions().1 * 4;
    let quality_factor = (target_size_bytes as f64 / current_size_bytes as f64).sqrt();

    // Apply the quality factor to reduce image quality
    imageops::resize(
        rgba_image,
        (quality_factor * rgba_image.width() as f64) as u32,
        (quality_factor * rgba_image.height() as f64) as u32,
        image::imageops::FilterType::CatmullRom,
    );
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::{Path, PathBuf};

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

        println!("Image path: {:?}", IMAGE_PATH);
        println!("Base path: {:?}", base_path);

        // Generate a lower quality image
        let result = generate_image("test_image.png", base_path, 200, 200, 50);
        assert!(result);

        // Check if the file was generated
        let generated_file_path = Path::new(base_path).join("lower_test_image.png");
        assert!(generated_file_path.exists());

        // Clean up the generated file
        fs::remove_dir_all(base_path).expect("Failed to delete destination directory");
    }
}

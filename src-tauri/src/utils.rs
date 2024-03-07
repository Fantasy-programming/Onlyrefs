use image::{imageops, DynamicImage, GenericImageView, RgbaImage};
use mime_guess::from_path;
use std::fs;
use std::path::Path;

pub fn determine_media_type(file_name: &str) -> String {
    if let Some(media_type) = from_path(file_name).first() {
        media_type.to_string()
    } else {
        "application/octet-stream".to_string()
    }
}

pub fn analyze_dimensions(file_path: &str) -> Option<(u32, u32)> {
    // Use the image crate to open the image and retrieve its dimensions
    if let Ok(image) = image::open(file_path) {
        Some(image.dimensions())
    } else {
        // Return None if dimensions cannot be determined (e.g., non-image file)
        None
    }
}

pub fn generate_image(
    file_name: &str,
    file_path: &str,
    dest_path: &str,
    height: u32,
    width: u32,
    target_size: u32,
) {
    // If the file is a gif or video stop the process

    let media_type = determine_media_type(file_name);
    if media_type.contains("gif") || media_type.contains("video") {
        return;
    }

    // Open and resize the image
    let mut image = image::open(file_path).expect("Failed to open image");
    image = image.resize_exact(height, width, image::imageops::FilterType::Lanczos3);

    // lower the quality
    let lower_quality_image = reduce_quality(image, target_size);

    // Save into filename_lower
    let dest_file_name = format!("lower_{}", file_name);
    let dest_path = Path::new(dest_path).join(dest_file_name);
    lower_quality_image
        .save(dest_path)
        .expect("Failed to save image");
}

fn reduce_quality(image: DynamicImage, target_size_kb: u32) -> DynamicImage {
    // Convert the image to RgbaImage for manipulation
    let mut rgba_image = RgbaImage::from(image.to_rgba8());

    // Reduce the image quality
    reduce_image_quality(&mut rgba_image, target_size_kb);

    // Convert the RgbaImage back to DynamicImage
    DynamicImage::ImageRgba8(rgba_image)
}

fn reduce_image_quality(rgba_image: &mut RgbaImage, target_size_kb: u32) {
    // Calculate the target size in bytes
    let target_size_bytes = target_size_kb * 1024;

    // Calculate the current size of the image in bytes
    let current_size_bytes = rgba_image.dimensions().0 * rgba_image.dimensions().1 * 4;

    // Calculate the quality factor to achieve the target size
    let quality_factor = (target_size_bytes as f64 / current_size_bytes as f64).sqrt();

    // Apply the quality factor to reduce image quality
    imageops::resize(
        rgba_image,
        (quality_factor * rgba_image.width() as f64) as u32,
        (quality_factor * rgba_image.height() as f64) as u32,
        image::imageops::FilterType::Lanczos3,
    );
}

pub fn analyze_file_size(file_path: &str) -> u64 {
    fs::metadata(file_path).map(|meta| meta.len()).unwrap_or(0)
}

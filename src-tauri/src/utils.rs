use crate::commands::Metadata;
use image::{imageops, DynamicImage, GenericImageView, RgbaImage};
use kmeans_colors::Sort;
use kmeans_colors::{get_kmeans, Kmeans};
use mime_guess::from_path;
use palette::{FromColor, IntoColor, Lab, Pixel, Srgb};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Url;

#[derive(Serialize, Deserialize)]
pub struct MediaRef {
    imagepath: String,
    low_res_imagepath: String,
    metapath: String,
    metadata: Option<Metadata>,
}

pub fn determine_media_type(file_name: &str) -> String {
    if let Some(media_type) = from_path(file_name).first() {
        media_type.to_string()
    } else {
        "application/octet-stream".to_string()
    }
}

pub fn extract_colors(file_path: &str) -> Vec<String> {
    let media_type = determine_media_type(file_path);
    if media_type.contains("video") {
        return Vec::new();
    }
    let pixels = read_image(file_path).unwrap();
    dominant_colors(&pixels)
}

fn dominant_colors(pixels: &[u8]) -> Vec<String> {
    // Convert RGB [u8] buffer to Lab for k-means.
    let lab: Vec<Lab> = Srgb::from_raw_slice(pixels)
        .iter()
        .map(|x| x.into_format().into_color())
        .collect();

    // Iterate over the runs, keep the best results.
    let mut result = Kmeans::new();
    for i in 0..3 {
        let run_result = get_kmeans(10, 20, 0.0, false, &lab, 1000 + i as u64);
        if run_result.score < result.score {
            result = run_result;
        }
    }

    // Process centroid data.
    let mut res = Lab::sort_indexed_colors(&result.centroids, &result.indices);

    // Sort indexed colors by percentage.
    res.sort_unstable_by(|a, b| {
        (b.percentage)
            .partial_cmp(&a.percentage)
            .expect("Failed to compare values while sorting.")
    });

    // Uncomment to print RGB values and percentage.
    /*for r in res.iter() {
        let c: Srgb<u8> = Srgb::from_color(r.centroid).into_format();
        println!(
            "{} {} {} : {:.2}%",
            c.red,
            c.green,
            c.blue,
            r.percentage * 100f32
        );
    }*/

    // Format colors as RGB HEX string.
    let mut hex_colors = Vec::new();
    for r in res.iter() {
        let c: Srgb<u8> = Srgb::from_color(r.centroid).into_format();
        let hex_str = format!("#{:02x}{:02x}{:02x}", c.red, c.green, c.blue);
        hex_colors.push(hex_str);
    }
    hex_colors
}

fn read_image(path: &str) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let img = image::open(path)?;
    img.resize(150, 150, image::imageops::Nearest);

    let pixels = img
        .pixels()
        .flat_map(|p| [p.2 .0[0], p.2 .0[1], p.2 .0[2]])
        .collect();

    Ok(pixels)
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
    image = image.resize(height, width, image::imageops::FilterType::Lanczos3);

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

fn convert_file_src(path: &Path) -> String {
    let url = Url::from_file_path(path).unwrap();
    url.to_string()
}

fn parse_refs(refs: &[PathBuf]) -> MediaRef {
    let mut result = MediaRef {
        imagepath: String::new(),
        low_res_imagepath: String::new(),
        metapath: String::new(),
        metadata: None,
    };

    for ref_path in refs {
        if ref_path.file_name().unwrap() == "metadata.json" {
            result.metapath = ref_path.to_str().unwrap().to_string();
            result.metadata = Some(parse_metadata(ref_path));
        } else if ref_path
            .file_name()
            .unwrap()
            .to_str()
            .unwrap()
            .starts_with("lower_")
        {
            result.low_res_imagepath = ref_path.to_str().unwrap().to_string();
        } else {
            result.imagepath = ref_path.to_str().unwrap().to_string();
        }
    }

    result
}

fn get_all_refs(collections_dir: &Path) -> Vec<Vec<PathBuf>> {
    // Get all subdirectories in the collections_dir
    let mut refs = Vec::new();
    if let Ok(entries) = std::fs::read_dir(collections_dir) {
        for entry in entries.flatten() {
            if let Ok(path) = entry.path().canonicalize() {
                if path.is_dir() {
                    let mut children = Vec::new();
                    if let Ok(dir_entries) = std::fs::read_dir(&path) {
                        for child in dir_entries.flatten() {
                            children.push(child.path());
                        }
                    }
                    refs.push(children);
                }
            }
        }
    }
    refs
}

fn parse_metadata(path: &Path) -> Metadata {
    let content = std::fs::read_to_string(path).unwrap();

    let mut metadata: Metadata = serde_json::from_str(&content).unwrap_or_default();

    // If the `tags` field is missing, initialize it to an empty Vec
    if metadata.tags.is_empty() {
        metadata.tags = Vec::new();
    }

    metadata = Metadata {
        id: metadata.id,
        file_name: metadata.file_name,
        name: metadata.name,
        media_type: metadata.media_type,
        dimensions: metadata.dimensions,
        file_size: metadata.file_size,
        collection: metadata.collection,
        colors: metadata.colors,
        created_at: metadata.created_at,
        updated_at: metadata.updated_at,
        tags: metadata.tags,
        // Add any new fields here with their default values
        ..Default::default()
    };

    metadata
}

pub fn fetch_refs(collections_dir: &Path) -> Vec<MediaRef> {
    let refs = get_all_refs(collections_dir);
    refs.into_iter()
        .map(|ref_paths| parse_refs(&ref_paths))
        .collect()
}

pub fn add_tag(collections_dir: &Path, ref_id: &str, tag: &str) {
    let metadata_path = collections_dir.join(ref_id).join("metadata.json");
    let mut metadata: Metadata = parse_metadata(&metadata_path);
    metadata.tags.push(tag.to_string());
    let json_data = serde_json::to_string_pretty(&metadata).expect("Failed to serialize metadata");
    fs::write(metadata_path, json_data).expect("Failed to write metadata file");
}

pub fn remove_tag(collections_dir: &Path, ref_id: &str, tag: &str) {
    let metadata_path = collections_dir.join(ref_id).join("metadata.json");
    let mut metadata: Metadata = parse_metadata(&metadata_path);
    metadata.tags.retain(|t| t != tag);
    let json_data = serde_json::to_string_pretty(&metadata).expect("Failed to serialize metadata");
    fs::write(metadata_path, json_data).expect("Failed to write metadata file");
}

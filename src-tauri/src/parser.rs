use std::{
    fs::read_to_string,
    io,
    path::{Path, PathBuf},
};

use crate::state::{AudioMetadata, AudioRef, LinkMetadata, LinkRef};
use crate::state::{DocMetadata, DocRef, NoteMetadata, NoteRef};
use crate::state::{DesignMetadata, DesignRef, ModelMetadata, ModelRef};
use crate::state::{ImageMetadata, ImageRef, Ref, Settings, VideoMetadata, VideoRef};
use crate::state::{StackMetadata, StackRef};
use crate::utils::convert_file_src;

/// Parse a pathbuffer array into a Ref struct
pub fn parse_refs(refs: &[PathBuf]) -> Result<Ref, io::Error> {
    let metadata_file = refs.iter().find_map(|ref_path| {
        ref_path.file_name().and_then(|name| {
            let name_str = name.to_str()?;
            match name_str {
                "metadata.image.json" => Some(("image", ref_path)),
                "metadata.video.json" => Some(("video", ref_path)),
                "metadata.audio.json" => Some(("audio", ref_path)),
                "metadata.note.json" => Some(("note", ref_path)),
                "metadata.link.json" => Some(("link", ref_path)),
                "metadata.doc.json" => Some(("doc", ref_path)),
                "metadata.stack.json" => Some(("stack", ref_path)),
                "metadata.design.json" => Some(("design", ref_path)),
                "metadata.model.json" => Some(("model", ref_path)),
                _ => None,
            }
        })
    });

    match metadata_file {
        Some(("image", _)) => parse_image_ref(refs),
        Some(("video", _)) => parse_video_ref(refs),
        Some(("audio", _)) => parse_audio_ref(refs),
        Some(("note", _)) => parse_note_ref(refs),
        Some(("link", _)) => parse_link_ref(refs),
        Some(("doc", _)) => parse_doc_ref(refs),
        Some(("stack", _)) => parse_stack_ref(refs),
        Some(("design", _)) => parse_design_ref(refs),
        Some(("model", _)) => parse_model_ref(refs),
        _ => Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "Invalid input: neither a media nor a note reference found",
        )),
    }
}

/// Parse an image reference
fn parse_image_ref(refs: &[PathBuf]) -> Result<Ref, io::Error> {
    let mut image_ref = ImageRef::default();
    let mut has_image_file = false;

    for ref_path in refs {
        if let Some(file_name) = ref_path.file_name().and_then(|f| f.to_str()) {
            if file_name == "metadata.image.json" {
                let json_txt = std::fs::read_to_string(ref_path)?;
                let metadata = parse_metadata::<ImageMetadata>(&json_txt)?;
                image_ref.metapath = ref_path
                    .to_str()
                    .ok_or_else(|| {
                        io::Error::new(io::ErrorKind::InvalidData, "Invalid metapath encoding")
                    })?
                    .to_string();
                image_ref.metadata = Some(metadata);
            } else if file_name.starts_with("lower_") {
                image_ref.low_res_imagepath = convert_file_src(ref_path)?;
            } else {
                // This is the actual image file
                has_image_file = true;
                image_ref.image_path = convert_file_src(ref_path)?;
            }
        }
    }

    // Validate that we have an actual image file, not just metadata
    if !has_image_file || image_ref.image_path.is_empty() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            "Image file not found - only metadata exists",
        ));
    }

    if image_ref.low_res_imagepath.is_empty() {
        image_ref.low_res_imagepath = image_ref.image_path.clone();
    }

    Ok(Ref::Image(image_ref))
}

/// Parse a video reference
fn parse_video_ref(refs: &[PathBuf]) -> Result<Ref, io::Error> {
    let mut video_ref = VideoRef::default();
    let mut has_video_file = false;

    for ref_path in refs {
        if let Some(file_name) = ref_path.file_name().and_then(|f| f.to_str()) {
            if file_name == "metadata.video.json" {
                let json_txt = std::fs::read_to_string(ref_path)?;
                let metadata = parse_metadata::<VideoMetadata>(&json_txt)?;

                video_ref.metapath = ref_path
                    .to_str()
                    .ok_or_else(|| {
                        io::Error::new(io::ErrorKind::InvalidData, "Invalid metapath encoding")
                    })?
                    .to_string();
                video_ref.metadata = Some(metadata);
            } else {
                has_video_file = true;
                video_ref.video_path = convert_file_src(ref_path)?;
            }
        }
    }

    // Validate that we have an actual video file, not just metadata
    if !has_video_file || video_ref.video_path.is_empty() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            "Video file not found - only metadata exists",
        ));
    }

    Ok(Ref::Video(video_ref))
}

/// Parse an audio reference
fn parse_audio_ref(refs: &[PathBuf]) -> Result<Ref, io::Error> {
    let mut audio_ref = AudioRef::default();
    let mut has_audio_file = false;

    for ref_path in refs {
        if let Some(file_name) = ref_path.file_name().and_then(|f| f.to_str()) {
            if file_name == "metadata.audio.json" {
                let json_txt = std::fs::read_to_string(ref_path)?;
                let metadata = parse_metadata::<AudioMetadata>(&json_txt)?;
                audio_ref.metapath = ref_path
                    .to_str()
                    .ok_or_else(|| {
                        io::Error::new(io::ErrorKind::InvalidData, "Invalid metapath encoding")
                    })?
                    .to_string();
                audio_ref.metadata = Some(metadata);
            } else {
                has_audio_file = true;
                audio_ref.audio_path = convert_file_src(ref_path)?;
            }
        }
    }

    // Validate that we have an actual audio file, not just metadata
    if !has_audio_file || audio_ref.audio_path.is_empty() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            "Audio file not found - only metadata exists",
        ));
    }

    Ok(Ref::Audio(audio_ref))
}

/// Parse a note reference
fn parse_note_ref(refs: &[PathBuf]) -> Result<Ref, io::Error> {
    let mut note_ref = NoteRef::default();
    let mut has_metadata = false;

    for ref_path in refs {
        if let Some(file_name) = ref_path.file_name().and_then(|f| f.to_str()) {
            if file_name == "metadata.note.json" {
                let json_txt = std::fs::read_to_string(ref_path)?;
                let metadata = parse_metadata::<NoteMetadata>(&json_txt)?;
                note_ref.metapath = ref_path
                    .to_str()
                    .ok_or_else(|| {
                        io::Error::new(io::ErrorKind::InvalidData, "Invalid metapath encoding")
                    })?
                    .to_string();
                note_ref.metadata = Some(metadata);
                has_metadata = true;
            } else if file_name == "note.text" {
                // Fixed: was "note.txt"
                note_ref.content = read_to_string(ref_path)?;
            }
        }
    }

    if !has_metadata {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            "Note metadata not found",
        ));
    }

    Ok(Ref::Note(note_ref))
}

/// Parse a link reference
fn parse_link_ref(refs: &[PathBuf]) -> Result<Ref, io::Error> {
    let mut link_ref = LinkRef::default();
    let mut has_metadata = false;

    for ref_path in refs {
        if let Some(file_name) = ref_path.file_name().and_then(|f| f.to_str()) {
            if file_name == "metadata.link.json" {
                let json_txt = std::fs::read_to_string(ref_path)?;
                let metadata = parse_metadata::<LinkMetadata>(&json_txt)?;
                link_ref.metapath = ref_path
                    .to_str()
                    .ok_or_else(|| {
                        io::Error::new(io::ErrorKind::InvalidData, "Invalid metapath encoding")
                    })?
                    .to_string();
                link_ref.metadata = Some(metadata);
                has_metadata = true;
            } else {
                link_ref.snapshoot = convert_file_src(ref_path)?;
            }
        }
    }

    if !has_metadata {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            "Link metadata not found",
        ));
    }

    Ok(Ref::Link(link_ref))
}

/// Parse a doc reference
fn parse_doc_ref(refs: &[PathBuf]) -> Result<Ref, io::Error> {
    let mut doc_ref = DocRef::default();
    let mut has_doc_file = false;

    for ref_path in refs {
        if let Some(file_name) = ref_path.file_name().and_then(|f| f.to_str()) {
            if file_name == "metadata.doc.json" {
                let json_txt = std::fs::read_to_string(ref_path)?;
                let metadata = parse_metadata::<DocMetadata>(&json_txt)?;
                doc_ref.metapath = ref_path
                    .to_str()
                    .ok_or_else(|| {
                        io::Error::new(io::ErrorKind::InvalidData, "Invalid metapath encoding")
                    })?
                    .to_string();
                doc_ref.metadata = Some(metadata);
            } else {
                has_doc_file = true;
                doc_ref.doc_path = convert_file_src(ref_path)?;
            }
        }
    }

    // Validate that we have an actual doc file, not just metadata
    if !has_doc_file || doc_ref.doc_path.is_empty() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            "Document file not found - only metadata exists",
        ));
    }

    Ok(Ref::Doc(doc_ref))
}

/// Parse a stack reference
/// Note: Stack items are resolved later when all refs are loaded
fn parse_stack_ref(refs: &[PathBuf]) -> Result<Ref, io::Error> {
    let mut stack_ref = StackRef::default();
    let mut has_metadata = false;

    for ref_path in refs {
        if let Some(file_name) = ref_path.file_name().and_then(|f| f.to_str()) {
            if file_name == "metadata.stack.json" {
                let json_txt = std::fs::read_to_string(ref_path)?;
                let metadata = parse_metadata::<StackMetadata>(&json_txt)?;
                stack_ref.metapath = ref_path
                    .to_str()
                    .ok_or_else(|| {
                        io::Error::new(io::ErrorKind::InvalidData, "Invalid metapath encoding")
                    })?
                    .to_string();
                stack_ref.metadata = Some(metadata);
                has_metadata = true;
            }
        }
    }

    if !has_metadata {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            "Stack metadata not found",
        ));
    }

    // Note: stack_ref.items will be empty here - they get resolved
    // after all refs are loaded by calling resolve_stack_items()
    Ok(Ref::Stack(stack_ref))
}

/// Parse a design reference (PSD, AI, PDF, etc.)
fn parse_design_ref(refs: &[PathBuf]) -> Result<Ref, io::Error> {
    let mut design_ref = DesignRef::default();
    let mut has_design_file = false;

    for ref_path in refs {
        if let Some(file_name) = ref_path.file_name().and_then(|f| f.to_str()) {
            if file_name == "metadata.design.json" {
                let json_txt = std::fs::read_to_string(ref_path)?;
                let metadata = parse_metadata::<DesignMetadata>(&json_txt)?;
                design_ref.metapath = ref_path
                    .to_str()
                    .ok_or_else(|| {
                        io::Error::new(io::ErrorKind::InvalidData, "Invalid metapath encoding")
                    })?
                    .to_string();
                design_ref.metadata = Some(metadata);
            } else if file_name.starts_with("thumbnail_") {
                design_ref.thumbnail_path = convert_file_src(ref_path)?;
            } else {
                // This is the actual design file
                has_design_file = true;
                design_ref.design_path = convert_file_src(ref_path)?;
            }
        }
    }

    // Validate that we have an actual design file, not just metadata
    if !has_design_file || design_ref.design_path.is_empty() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            "Design file not found - only metadata exists",
        ));
    }

    Ok(Ref::Design(design_ref))
}

/// Parse a model reference (GLB, GLTF, OBJ, FBX, STL)
fn parse_model_ref(refs: &[PathBuf]) -> Result<Ref, io::Error> {
    let mut model_ref = ModelRef::default();
    let mut has_model_file = false;

    for ref_path in refs {
        if let Some(file_name) = ref_path.file_name().and_then(|f| f.to_str()) {
            if file_name == "metadata.model.json" {
                let json_txt = std::fs::read_to_string(ref_path)?;
                let metadata = parse_metadata::<ModelMetadata>(&json_txt)?;
                model_ref.metapath = ref_path
                    .to_str()
                    .ok_or_else(|| {
                        io::Error::new(io::ErrorKind::InvalidData, "Invalid metapath encoding")
                    })?
                    .to_string();
                model_ref.metadata = Some(metadata);
            } else if file_name.starts_with("thumbnail_") {
                model_ref.thumbnail_path = convert_file_src(ref_path)?;
            } else {
                // This is the actual model file
                has_model_file = true;
                model_ref.model_path = convert_file_src(ref_path)?;
            }
        }
    }

    // Validate that we have an actual model file, not just metadata
    if !has_model_file || model_ref.model_path.is_empty() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            "Model file not found - only metadata exists",
        ));
    }

    Ok(Ref::Model(model_ref))
}

/// Parse a media metadata file
fn parse_metadata<'de, T: serde::Deserialize<'de>>(str: &'de str) -> Result<T, io::Error> {
    serde_json::from_str(str).map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))
}

/// Resolve stack items after all refs are loaded
/// This populates the `items` field of StackRef with actual Ref objects
pub fn resolve_stack_items(refs: &mut Vec<Ref>) {
    // First, collect all non-stack refs into a map for quick lookup
    let ref_map: std::collections::HashMap<String, Ref> = refs
        .iter()
        .filter(|r| !matches!(r, Ref::Stack(_)))
        .map(|r| (r.get_id().to_string(), r.clone()))
        .collect();

    // Now resolve each stack's items
    for r in refs.iter_mut() {
        if let Ref::Stack(stack_ref) = r {
            if let Some(metadata) = &stack_ref.metadata {
                stack_ref.items = metadata
                    .item_ids
                    .iter()
                    .filter_map(|id| ref_map.get(id).map(|r| Box::new(r.clone())))
                    .collect();
            }
        }
    }
}

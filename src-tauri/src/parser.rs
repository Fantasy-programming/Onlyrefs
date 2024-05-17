use std::{
    fs::read_to_string,
    path::{Path, PathBuf},
};

use crate::state::{AudioMetadata, AudioRef, LinkMetadata, LinkRef};
use crate::state::{DocMetadata, DocRef, NoteMetadata, NoteRef};
use crate::state::{ImageMetadata, ImageRef, Ref, Settings, VideoMetadata, VideoRef};
use crate::utils::convert_file_src;

/// Parse a pathbuffer array into a Ref struct
pub fn parse_refs(refs: &[PathBuf]) -> Result<Ref, std::io::Error> {
    if refs
        .iter()
        .any(|ref_path| ref_path.file_name().unwrap() == "metadata.image.json")
    {
        return parse_image_ref(refs);
    }

    if refs
        .iter()
        .any(|ref_path| ref_path.file_name().unwrap() == "metadata.video.json")
    {
        return parse_video_ref(refs);
    }

    if refs
        .iter()
        .any(|ref_path| ref_path.file_name().unwrap() == "metadata.audio.json")
    {
        return parse_audio_ref(refs);
    }

    if refs
        .iter()
        .any(|ref_path| ref_path.file_name().unwrap() == "metadata.note.json")
    {
        return parse_note_ref(refs);
    }

    if refs
        .iter()
        .any(|ref_path| ref_path.file_name().unwrap() == "metadata.link.json")
    {
        return parse_link_ref(refs);
    }

    if refs
        .iter()
        .any(|ref_path| ref_path.file_name().unwrap() == "metadata.doc.json")
    {
        return parse_doc_ref(refs);
    }

    Err(std::io::Error::new(
        std::io::ErrorKind::InvalidInput,
        "Invalid input: neither a media nor a note reference found",
    ))
}

/// Parse a image reference
fn parse_image_ref(refs: &[PathBuf]) -> Result<Ref, std::io::Error> {
    let mut image_ref = ImageRef::default();

    for ref_path in refs {
        if ref_path.file_name().unwrap() == "metadata.image.json" {
            let json_txt = std::fs::read_to_string(ref_path)?;
            let metadata = parse_metadata::<ImageMetadata>(&json_txt)?;
            image_ref.metapath = ref_path.to_str().unwrap().to_string();
            image_ref.metadata = Some(metadata);
            continue;
        }

        if ref_path
            .file_name()
            .unwrap()
            .to_str()
            .unwrap()
            .starts_with("lower_")
        {
            image_ref.low_res_imagepath = convert_file_src(ref_path);
            continue;
        }
        image_ref.image_path = convert_file_src(ref_path);
    }

    if image_ref.low_res_imagepath.is_empty() {
        image_ref.low_res_imagepath = image_ref.image_path.clone();
    }

    Ok(Ref::Image(image_ref))
}

/// Parse a video reference
fn parse_video_ref(refs: &[PathBuf]) -> Result<Ref, std::io::Error> {
    let mut video_ref = VideoRef::default();

    for ref_path in refs {
        if ref_path.file_name().unwrap() == "metadata.video.json" {
            let json_txt = std::fs::read_to_string(ref_path)?;
            let metadata = parse_metadata::<VideoMetadata>(&json_txt)?;
            video_ref.metapath = ref_path.to_str().unwrap().to_string();
            video_ref.metadata = Some(metadata);
            continue;
        }

        video_ref.video_path = convert_file_src(ref_path);
    }

    Ok(Ref::Video(video_ref))
}

/// Parse an audio reference
fn parse_audio_ref(refs: &[PathBuf]) -> Result<Ref, std::io::Error> {
    let mut audio_ref = AudioRef::default();

    for ref_path in refs {
        if ref_path.file_name().unwrap() == "metadata.audio.json" {
            let json_txt = std::fs::read_to_string(ref_path)?;
            let metadata = parse_metadata::<AudioMetadata>(&json_txt)?;
            audio_ref.metapath = ref_path.to_str().unwrap().to_string();
            audio_ref.metadata = Some(metadata);
            continue;
        }

        audio_ref.audio_path = convert_file_src(ref_path);
    }

    Ok(Ref::Audio(audio_ref))
}

/// Parse a note reference
fn parse_note_ref(refs: &[PathBuf]) -> Result<Ref, std::io::Error> {
    let mut note_ref = NoteRef::default();

    for ref_path in refs {
        if ref_path.file_name().unwrap() == "metadata.note.json" {
            let json_txt = std::fs::read_to_string(ref_path)?;
            let metadata = parse_metadata::<NoteMetadata>(&json_txt)?;
            note_ref.metapath = ref_path.to_str().unwrap().to_string();
            note_ref.metadata = Some(metadata);
        }

        if ref_path.file_name().unwrap() == "note.txt" {
            note_ref.content = read_to_string(ref_path)?;
        }
    }

    Ok(Ref::Note(note_ref))
}

fn parse_link_ref(refs: &[PathBuf]) -> Result<Ref, std::io::Error> {
    let mut link_ref = LinkRef::default();

    for ref_path in refs {
        if ref_path.file_name().unwrap() == "metadata.link.json" {
            let json_txt = std::fs::read_to_string(ref_path)?;
            let metadata = parse_metadata::<LinkMetadata>(&json_txt)?;
            link_ref.metapath = ref_path.to_str().unwrap().to_string();
            link_ref.metadata = Some(metadata);
            continue;
        }

        link_ref.snapshoot = convert_file_src(ref_path);
    }

    Ok(Ref::Link(link_ref))
}

fn parse_doc_ref(refs: &[PathBuf]) -> Result<Ref, std::io::Error> {
    let mut doc_ref = DocRef::default();

    for ref_path in refs {
        if ref_path.file_name().unwrap() == "metadata.doc.json" {
            let json_txt = std::fs::read_to_string(ref_path)?;
            let metadata = parse_metadata::<DocMetadata>(&json_txt)?;
            doc_ref.metapath = ref_path.to_str().unwrap().to_string();
            doc_ref.metadata = Some(metadata);
            continue;
        }

        doc_ref.doc_path = convert_file_src(ref_path);
    }

    Ok(Ref::Doc(doc_ref))
}

/// parse a media metadata file
fn parse_metadata<'de, T: serde::Deserialize<'de>>(str: &'de str) -> Result<T, std::io::Error> {
    let metadata: T = serde_json::from_str(str)?;
    Ok(metadata)
}

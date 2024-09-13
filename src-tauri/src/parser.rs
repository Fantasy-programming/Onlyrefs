use std::{
    fs::read_to_string,
    io,
    path::{Path, PathBuf},
};

use crate::state::{AudioMetadata, AudioRef, LinkMetadata, LinkRef};
use crate::state::{DocMetadata, DocRef, NoteMetadata, NoteRef};
use crate::state::{ImageMetadata, ImageRef, Ref, Settings, VideoMetadata, VideoRef};
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
        _ => Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "Invalid input: neither a media nor a note reference found",
        )),
    }
}

/// Parse a image reference
fn parse_image_ref(refs: &[PathBuf]) -> Result<Ref, io::Error> {
    let mut image_ref = ImageRef::default();

    for ref_path in refs {
        if let Some(file_name) = ref_path.file_name().and_then(|f| f.to_str()) {
            if file_name == "metadata.image.json" {
                let json_txt = std::fs::read_to_string(ref_path)?;
                let metadata = parse_metadata::<ImageMetadata>(&json_txt)?;
                image_ref.metapath = ref_path
                    .to_str()
                    .ok_or_else(|| {
                        std::io::Error::new(std::io::ErrorKind::InvalidData, "Invalid metapath")
                    })?
                    .to_string();
                image_ref.metadata = Some(metadata);
            } else if file_name.starts_with("lower_") {
                image_ref.low_res_imagepath = convert_file_src(ref_path);
            } else {
                image_ref.image_path = convert_file_src(ref_path);
            }
        }
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
        if let Some(file_name) = ref_path.file_name().and_then(|f| f.to_str()) {
            if file_name == "metadata.video.json" {
                let json_txt = std::fs::read_to_string(ref_path)?;
                let metadata = parse_metadata::<VideoMetadata>(&json_txt)?;

                video_ref.metapath = ref_path
                    .to_str()
                    .ok_or_else(|| {
                        std::io::Error::new(std::io::ErrorKind::InvalidData, "Invalid metapath")
                    })?
                    .to_string();
                video_ref.metadata = Some(metadata);
            } else {
                video_ref.video_path = convert_file_src(ref_path);
            }
        }
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

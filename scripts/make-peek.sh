#!/bin/sh
# Makes the small copies a home card's hover peek plays (see
# src/components/project-peek.tsx): 960px wide (sharp at 2x for windows up
# to 480px),
# stills as JPEG, clips cut to their first 3s, silent.
#
#   scripts/make-peek.sh <project id> <shot file>...
#   scripts/make-peek.sh stint public/projects/stint/*.png public/projects/stint/*.mp4
#
# Writes to public/projects/<id>/peek/, named like the shot (.png becomes .jpg).
set -e
id=$1
shift
out="public/projects/$id/peek"
mkdir -p "$out"
for file in "$@"; do
  name=$(basename "$file")
  case "$name" in
    *.mp4)
      ffmpeg -v error -y -i "$file" -t 3 -vf "scale=960:-2,fps=30" -an \
        -c:v libx264 -profile:v main -pix_fmt yuv420p -crf 26 \
        -movflags +faststart "$out/$name"
      ;;
    *)
      ffmpeg -v error -y -i "$file" \
        -vf "scale=960:-2:flags=lanczos,format=yuvj420p" -q:v 3 \
        "$out/${name%.*}.jpg"
      ;;
  esac
done

use std::fs::{self, DirEntry};
use std::io;
use std::path::Path;

// one possible implementation of walking a directory only visiting files, yoiked for gpt
pub fn visit_dirs(dir: &Path, cb: &mut dyn FnMut(&DirEntry)) -> io::Result<()> {
    if dir.is_dir() {
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_dir() {
                visit_dirs(&path, cb)?;
            } else {
                cb(&entry);
            }
        }
    }
    Ok(())
}

pub fn levenshtein_distance(a: &str, b: &str) -> usize {
    let len_a = a.len();
    let len_b = b.len();

    // If one of the strings is empty, the distance is the length of the other string.
    if len_a == 0 {
        return len_b;
    }
    if len_b == 0 {
        return len_a;
    }

    // Create a 2D matrix initialized with zeroes.
    // This will store the edit distances at each step.
    let mut matrix = vec![vec![0; len_b + 1]; len_a + 1];

    // Initialize the first row and first column.
    // The first row represents transforming `a` into an empty string (deleting characters).
    // The first column represents transforming an empty string into `b` (inserting characters).
    for i in 0..=len_a {
        matrix[i][0] = i; // Cost of deleting characters from `a`
    }
    for j in 0..=len_b {
        matrix[0][j] = j; // Cost of inserting characters into `a` to form `b`
    }

    // Iterate through the matrix, filling it in row by row.
    for i in 1..=len_a {
        for j in 1..=len_b {
            // Check if characters match
            let cost = if a.chars().nth(i - 1) == b.chars().nth(j - 1) {
                0 // No cost if the characters are the same
            } else {
                1 // Substitution cost
            };

            // Calculate the possible operations:
            let insertion = matrix[i][j - 1] + 1; // Cost of inserting a character
            let deletion = matrix[i - 1][j] + 1; // Cost of deleting a character
            let substitution = matrix[i - 1][j - 1] + cost; // Cost of replacing a character

            // Choose the minimum cost operation
            matrix[i][j] = insertion.min(deletion).min(substitution);
        }
    }

    // The final edit distance is stored in the bottom-right cell of the matrix.
    matrix[len_a][len_b]
}

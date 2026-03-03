package com.sreemarket.backend.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

    // Base directory to store the uploaded files
    private final Path fileStorageLocation;

    public FileStorageService() {
        this.fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    /**
     * Stores a file in the uploads directory inside a specific sub-folder.
     * 
     * @param file      the MultipartFile to store
     * @param subFolder the sub-folder name (e.g., "store-logos")
     * @return the relative URL/path to access the file
     */
    public String storeFile(MultipartFile file, String subFolder) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        // Clean up the file name and get the extension
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = "";

        if (originalFileName.contains(".")) {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }

        // Generate a unique filename using UUID
        String newFileName = UUID.randomUUID().toString() + fileExtension;

        try {
            // Check if the file's name contains invalid characters
            if (newFileName.contains("..")) {
                throw new RuntimeException("Sorry! Filename contains invalid path sequence " + newFileName);
            }

            // Create subfolder target directory if it doesn't exist
            Path targetDirectory = this.fileStorageLocation.resolve(subFolder);
            Files.createDirectories(targetDirectory);

            // Copy file to the target location (Replacing existing file with the same name)
            Path targetLocation = targetDirectory.resolve(newFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // Return the relative URL (path starting from /uploads)
            return "/uploads/" + subFolder + "/" + newFileName;

        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + newFileName + ". Please try again!", ex);
        }
    }

}

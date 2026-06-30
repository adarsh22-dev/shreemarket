package com.sreemarket.backend.service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.UUID;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

    private static final List<String> IMAGE_EXTENSIONS = Arrays.asList(".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".tif");
    private static final long MAX_DIMENSION = 1920;
    private static final float COMPRESSION_QUALITY = 0.8f;

    private final Path fileStorageLocation;

    public FileStorageService(@Value("${file.upload-dir:uploads}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    public String storeFile(MultipartFile file, String subFolder) {
        return storeFile(file, subFolder, false);
    }

    public String storeFile(MultipartFile file, String subFolder, boolean compress) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = "";
        if (originalFileName.contains(".")) {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf(".")).toLowerCase();
        }

        try {
            Path targetDirectory = this.fileStorageLocation.resolve(subFolder);
            Files.createDirectories(targetDirectory);

            if (compress && IMAGE_EXTENSIONS.contains(fileExtension)) {
                return storeCompressedImage(file, targetDirectory);
            }

            String newFileName = UUID.randomUUID().toString() + fileExtension;
            if (newFileName.contains("..")) {
                throw new RuntimeException("Sorry! Filename contains invalid path sequence " + newFileName);
            }
            Path targetLocation = targetDirectory.resolve(newFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/" + subFolder + "/" + newFileName;

        } catch (IOException ex) {
            throw new RuntimeException("Could not store file. Please try again!", ex);
        }
    }

    private String storeCompressedImage(MultipartFile file, Path targetDirectory) throws IOException {
        BufferedImage image = ImageIO.read(file.getInputStream());
        if (image == null) {
            throw new IOException("Could not read image file");
        }

        BufferedImage processed = image;
        int w = image.getWidth();
        int h = image.getHeight();
        if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
            double scale = Math.min(MAX_DIMENSION / (double) w, MAX_DIMENSION / (double) h);
            int newW = (int) (w * scale);
            int newH = (int) (h * scale);
            java.awt.Image scaled = image.getScaledInstance(newW, newH, java.awt.Image.SCALE_SMOOTH);
            processed = new BufferedImage(newW, newH, BufferedImage.TYPE_INT_RGB);
            processed.getGraphics().drawImage(scaled, 0, 0, null);
        }

        String newFileName = UUID.randomUUID().toString() + ".jpg";
        if (newFileName.contains("..")) {
            throw new RuntimeException("Sorry! Filename contains invalid path sequence " + newFileName);
        }

        Path targetLocation = targetDirectory.resolve(newFileName);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
        if (writers.hasNext()) {
            ImageWriter writer = writers.next();
            try (ImageOutputStream ios = ImageIO.createImageOutputStream(baos)) {
                writer.setOutput(ios);
                ImageWriteParam param = writer.getDefaultWriteParam();
                param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                param.setCompressionQuality(COMPRESSION_QUALITY);
                writer.write(null, new IIOImage(processed, null, null), param);
            } finally {
                writer.dispose();
            }
        } else {
            // Fallback: write uncompressed
            ImageIO.write(processed, "jpg", baos);
        }

        Files.write(targetLocation, baos.toByteArray());
        return "/uploads/" + targetDirectory.getFileName().toString() + "/" + newFileName;
    }
}

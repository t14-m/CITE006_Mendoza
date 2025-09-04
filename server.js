// Import necessary modules
const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Create the Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Create the 'public' and 'uploads' directories if they don't exist
const publicDir = path.join(__dirname, 'public');
const uploadsDir = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Specify the directory where uploaded files will be stored
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Use the original filename with a timestamp to prevent duplicates
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

// Define a file filter function to validate file types
const fileFilter = (req, file, cb) => {
    // Allowed file types based on the HTML description
    const allowedMimeTypes = [
        'image/png',
        'image/jpeg',
        'image/gif',
        'application/pdf',
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ];

    // Check if the uploaded file's MIME type is in the allowed list
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true); // Accept the file
    } else {
        // Reject the file and provide a helpful error message
        cb(new Error('Invalid file type. Only PNG, JPG, GIF, PDF, DOC, and DOCX are allowed.'), false);
    }
};

// Configure the multer middleware with the storage and file filter
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB file size limit
    }
});

// Serve static files from the 'public' directory
app.use(express.static(publicDir));

// Handle the file upload POST request
// The 'upload.single()' middleware will handle parsing the file.
// If an error occurs (e.g., from the fileFilter), it will pass it to the error handler below.
app.post('/upload', upload.single('uploadedFile'), (req, res) => {
    // This part of the code will only run if the upload was successful
    if (req.file) {
        console.log(`File uploaded successfully: ${req.file.path}`);
        res.status(200).send({
            message: 'File uploaded successfully!',
            filename: req.file.filename
        });
    } else {
        // This handles the case where the form is submitted without a file
        res.status(400).send({
            message: 'No file was uploaded.'
        });
    }
});

// --- THIS IS THE FIX ---
// Add a dedicated error-handling middleware.
// This function will execute if any middleware before it (like multer) calls next(error).
app.use((error, req, res, next) => {
    // Log the error for debugging purposes
    console.error(error);
    // Send a user-friendly error message
    res.status(400).send({ message: error.message });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
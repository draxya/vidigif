const express = require('express');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Create the 'uploads' directory if it doesn't exist
const uploadDirectory = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory);
}

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Render the upload form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle file upload
app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  // Generate output file name
  const outputFileName = 'vidigif-' + req.file.filename.replace(/\.[^/.]+$/, '.gif');
  
  const videoPath = path.join(uploadDirectory, req.file.filename);
  const gifPath = path.join(uploadDirectory, outputFileName);

  // Convert video to GIF with optimized settings
  const command = `ffmpeg -i "${videoPath}" -vf "fps=25,scale=640:-1:flags=lanczos" -c:v gif "${gifPath}"`;
  exec(command, (error) => {
    if (error) {
      console.error('Conversion failed:', error);
      return res.status(500).send('Conversion failed.');
    }

    // Provide download link to the converted GIF
    res.download(gifPath, () => {
      // Remove the converted file after download
      fs.unlink(gifPath, (err) => {
        if (err) {
          console.error('Failed to delete the converted file:', err);
        }
      });
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

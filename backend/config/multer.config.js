const multer = require("multer");
const path = require("path");
const fs = require("fs");
const uploadsDirectory = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDirectory)) {
    fs.mkdirSync(uploadsDirectory, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDirectory);
    },
    filename: (req, file, cb) => { const extension = path.extname(file.originalname).toLowerCase(); const uniqueName = `${Date.now()}-${require("crypto").randomUUID()}${extension}`; cb(null, uniqueName); },
});
const allowedExtensions = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "image/gif": [".gif"],
    "application/pdf": [".pdf"],
};
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB 
        files: 1,
    }, fileFilter: (req, file, cb) => { const extension = path.extname(file.originalname).toLowerCase(); const allowed = allowedExtensions[file.mimetype]; if (!allowed || !allowed.includes(extension)) { return cb(new Error("Only PDF resumes or supported image files are allowed.")); } cb(null, true); },
});
module.exports = upload;
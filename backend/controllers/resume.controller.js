const fs = require("fs/promises");
const path = require("path");
const { PDFParse } = require("pdf-parse");
const Job = require("../models/job.model");
const User = require("../models/user.model");
function extractSkills(text) {
    const skillList = [
        "Java", "Python", "JavaScript", "TypeScript", "C++", "C",
        "React", "Next.js", "Node.js", "Express.js", "MongoDB",
        "MySQL", "SQL", "HTML", "CSS", "Git", "GitHub",
        "Data Structures", "Algorithms", "Machine Learning",
        "Artificial Intelligence", "Deep Learning", "Cybersecurity",
        "Cloud Computing", "AWS", "Azure", "Docker", "Linux",
        "REST API", "Communication", "Problem Solving"
    ];
    const normalizedText = text.toLowerCase(); return skillList.filter((skill) => { const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); const pattern = new RegExp(`(^|[^a-z0-9+#.])${escaped.toLowerCase()}($|[^a-z0-9+#.])`, "i"); return pattern.test(normalizedText); });
}
exports.analyzeResume = async (req, res) => {
    let parser;
    try { const user = await User.findById(req.user.id); if (!user || !user.resume) { return res.status(400).json({ message: "Please upload your PDF resume first." }); } const uploadsDirectory = path.resolve(process.cwd(), "uploads"); const resumePath = path.resolve(uploadsDirectory, user.resume); if (path.dirname(resumePath) !== uploadsDirectory || !user.resume.toLowerCase().endsWith(".pdf")) { return res.status(400).json({ message: "Invalid resume file." }); } const fileBuffer = await fs.readFile(resumePath); parser = new PDFParse({ data: fileBuffer }); const result = await parser.getText(); const resumeText = result.text || ""; if (!resumeText.trim()) { return res.status(400).json({ message: "No readable text found. Please upload a text-based PDF resume." }); } const resumeSkills = extractSkills(resumeText); const jobs = await Job.find({ isActive: true }).lean(); const matches = jobs.map((job) => { const jobSkills = [...(Array.isArray(job.skills) ? job.skills : []), job.description || "", job.title || ""].join(" "); const requiredSkills = extractSkills(jobSkills); const matchedSkills = requiredSkills.filter((skill) => resumeSkills.includes(skill)); const missingSkills = requiredSkills.filter((skill) => !resumeSkills.includes(skill)); const matchPercentage = requiredSkills.length ? Math.round((matchedSkills.length / requiredSkills.length) * 100) : 0; return { jobId: job._id, title: job.title, company: job.company, location: job.location, jobType: job.jobType, matchPercentage, matchedSkills, missingSkills }; }); matches.sort((a, b) => b.matchPercentage - a.matchPercentage); return res.json({ message: "Resume analyzed successfully.", detectedSkills: resumeSkills, totalJobsAnalyzed: matches.length, matches }); } catch (error) { console.error("Resume analysis error:", error); if (error.code === "ENOENT") { return res.status(404).json({ message: "Resume file not found. Please upload your resume again." }); } return res.status(500).json({ message: "Unable to analyze resume." }); } finally { if (parser) { await parser.destroy().catch(() => { }); } }
};
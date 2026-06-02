import { v2 as cloudinary } from 'cloudinary';

// Cloudinary credentials (set as constants as requested)
// NOTE: In production, use environment variables instead of hardcoding secrets.
cloudinary.config({
    cloud_name: 'dfm5z3gmm',
    api_key: '678994326865647',
    api_secret: 'MtzTldwbXNmk0sNDsYyaBoH9BhQ',
});

export default cloudinary;


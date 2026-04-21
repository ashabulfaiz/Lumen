const errorHandler = (err, req, res, next) => {
    // 1. Tentukan status code. Kalau tidak ada, default ke 500 (Internal Server Error)
    const statusCode = res.statusCode ? res.statusCode : 500;
    
    // 2. Set status code di response
    res.status(statusCode);

    // 3. Kirimkan pesan error dalam format JSON yang rapi
    res.json({
        status: "error",
        message: err.message,
        // Tampilkan detail error (stack) hanya jika kita SEDANG DALAM TAHAP DEVELOPMENT
        // Kalau nanti sudah live (production), sembunyikan detailnya biar aman
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

module.exports = { errorHandler };
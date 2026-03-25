function generateOrderNumber() {
    const prefix = 'ORD';
    const timestamp = Date.now().toString().slice(-6); // ใช้ 6 หลักสุดท้ายของ timestamp
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // สุ่ม 3 หลัก
    return `${prefix}-${timestamp}-${random}`;
}

module.exports = {
    generateOrderNumber
};
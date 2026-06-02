const db = require('../config/database');

const SLUG_TO_NAME = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
};

async function resolveLevelId(levelRef) {
    const ref = String(levelRef ?? '').trim();
    if (!ref) return null;

    if (/^\d+$/.test(ref)) {
        const id = parseInt(ref, 10);
        const [rows] = await db.query('SELECT id FROM levels WHERE id = ? LIMIT 1', [id]);
        return rows[0]?.id ?? null;
    }

    const slug = ref.toLowerCase();
    const name = SLUG_TO_NAME[slug] || ref;
    const [rows] = await db.query(
        'SELECT id FROM levels WHERE LOWER(nama_level) = LOWER(?) LIMIT 1',
        [name],
    );
    return rows[0]?.id ?? null;
}

module.exports = { resolveLevelId, SLUG_TO_NAME };

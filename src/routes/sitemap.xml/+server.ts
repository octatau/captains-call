import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export const GET: RequestHandler = async () => {
	const { data: puzzles } = await supabaseAdmin
		.from('puzzles')
		.select('puzzle_number, daily_date')
		.lte('daily_date', new Date().toISOString().split('T')[0])
		.order('puzzle_number', { ascending: false });

	const base = 'https://www.playtopick.com';

	const urls = [
		`<url><loc>${base}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
		`<url><loc>${base}/archive</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`
	];

	if (puzzles) {
		for (const p of puzzles) {
			urls.push(
				`<url><loc>${base}/${p.puzzle_number}</loc><lastmod>${p.daily_date}</lastmod><priority>0.6</priority></url>`
			);
		}
	}

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
};

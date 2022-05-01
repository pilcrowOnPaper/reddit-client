import type { Promise_Status } from '$lib/types';
import type { Post_Filter } from '$lib/types/filter';
import type { Batch } from '$lib/types/posts';
import type { Listing, Post } from '$lib/types/reddit';

export const getUserListing = async (
	user: string,
	type?: string,
	after?: string,
	filter?: Post_Filter
): Promise<Promise_Status<Listing<Post>>> => {
	const url = getUserRequestUrl(user, type, after, filter);
	const response = await fetch(url);
	if (!response.ok) {
		return {
			success: false
		};
	}
	const result = (await response.json()) as Listing<Post>;
	return {
		success: true,
		data: result
	};
};

export const getUserRequestUrl = (
	user: string,
	type?: string,
	after?: string,
	filter?: Post_Filter
): string => {
	let base_url = `https://www.reddit.com/user/${user}`;
	if (type) {
		base_url = base_url + `/${type}`;
	}
	let url = base_url + '.json?raw_json=1';
    if (filter.sort) {
		url = url + `&sort=${filter.sort}`;
	}
	if (filter.time) {
		url = url + `&t=${filter.time}`;
	}
	if (after) {
		url = url + `&after=${after}`;
	}
    console.log(url)
	return url;
};

export const getUserPathname = (
	user: string,
	path?: string,
	after?: string,
	filter?: Post_Filter
): string => {
	let base = `/u/${user}`;
	if (path) {
		base = base + `/${path}`;
	}
    base = base + "?"
	if (filter.sort) {
		base = base + `&sort=${filter.sort}`;
	}
	let pathname = base;
	if (filter.time) {
		pathname = pathname + `&time=${filter.time}`;
	}
	if (after) {
		pathname = pathname + `&after=${after}`;
	}
	return pathname;
};

export const fetchNextPostBatch = async (
	user: string,
    type?: string,
	after?: string,
	filter?: Post_Filter
): Promise<Promise_Status<Batch>> => {
	const result = await getUserListing(user, type, after, filter);
	if (!result.success) {
		return {
			success: false
		};
	}
	const listing = result.data;
	return {
		success: true,
		data: {
			posts: listing.data.children,
			batch_count: listing.data.dist,
			after_id: listing.data.after
		}
	};
};
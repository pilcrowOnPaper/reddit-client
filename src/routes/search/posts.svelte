<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';

	export const load: Load = async ({ params, fetch, url }) => {
		const query = url.searchParams.get('q');
		const sort = url.searchParams.get('sort') || 'relevance';
		const time = url.searchParams.get('time') || 'all';
		const filter = { sort, time };
		let query_text: string;
		let subreddit: string = null;
		if (query.includes(':')) {
			subreddit = query.split(':')[0];
			query_text = query.split(':')[1];
		} else {
			query_text = query;
		}
		const request_url = getSearchRequestUrl(query_text, 'link', subreddit, null, filter);
		const listing_response = await fetch(request_url);
		if (!listing_response.ok) {
			return {
				status: 404
			};
		}
		const listing = await listing_response.json();
		return {
			props: {
				initial_listing: listing as Listing<Post>,
				filter,
				subreddit,
				query_text,
				query
			}
		};
	};
</script>

<script lang="ts">
	export let initial_listing: Listing<Post>;
	export let filter: Filter = {
		sort: null,
		time: null
	};
	export let subreddit: string;
	export let query_text: string;
	export let query: string;

	import Filter_Select from '$lib/components/search/Filter.svelte';
	import Cards from '$lib/components/subreddit/Cards.svelte';
	import Large from '$lib/components/cards/Large.svelte';
	import Compact from '$lib/components/cards/Compact.svelte';

	import type { Listing, Post } from '$lib/types/reddit';
	import type { Filter } from '$lib/types/filter';

	import { page } from '$app/stores';
	import { getSearchListing, getSearchPathname, getSearchRequestUrl } from '$lib/utils/search';
	import { selected_post } from '$lib/stores';

	let posts = initial_listing.data.children;
	let latest_post_in_view: number = 0;
	let after_id = initial_listing.data.after;
	let batch_count = initial_listing.data.dist;

	let card = 'large';

	const updateLatestPostInView = (id: number) => {
		if (id > latest_post_in_view) {
			latest_post_in_view = id;
		}
	};

	const getNextPostBatch = async (id: number) => {
		if (id > 0) {
			if (id % batch_count !== 0) return;
			if (!after_id) return;
		}
		const initial_sort = filter.sort ? filter.sort.valueOf() : null;
		const initial_time = filter.time ? filter.time.valueOf() : null;
		const result = await getSearchListing(query_text, 'link', subreddit, after_id, filter);
		if (!result.success) return;
		if (initial_sort !== filter.sort || initial_time !== filter.time) return;
		const listing = result.data;
		const new_posts = listing.data.children as Post[];
		posts = [...posts, ...new_posts];
		after_id = result.data.data.after;
		batch_count = new_posts.length;
	};

	const handleFilter = (e: CustomEvent) => {
		filter = e.detail.options as Filter;
		getNewPosts(true);
	};

	const handleCardTypeChange = (e: CustomEvent) => {
		card = e.detail.value;
	};

	const getNewPosts = async (update_history: boolean) => {
		posts = [];
		const new_url = $page.url.origin + getSearchPathname(query, 'link', filter);
		if (update_history) {
			window.history.replaceState({}, document.title, new_url);
		}
		const initial_sort = filter.sort.valueOf();
		const initial_time = filter.time.valueOf();
		let result = await getSearchListing(query_text, 'link', subreddit, after_id, filter);
		if (initial_sort !== filter.sort || initial_time !== filter.time) return;
		if (!result.success) return;
		const listing = result.data;
		posts = listing.data.children as Post[];
		latest_post_in_view = 0;
		after_id = listing.data.after;
		batch_count = listing.data.dist;
	};

	const openPost = (e: CustomEvent) => {
		selected_post.set(e.detail.post as Post);
	};

	$: getNextPostBatch(latest_post_in_view);
</script>

<div class="mt-2 flex place-content-between">
	<Filter_Select {filter} on:select={handleFilter} />
	<Cards bind:type={card} on:select={handleCardTypeChange} />
</div>
<div class="mt-2 flex flex-col divide-y">
	{#each posts as post, i}
		{#if card === 'compact'}
			<Compact
				{post}
				on:display={() => {
					updateLatestPostInView(i);
				}}
				on:open={openPost}
				show={['subreddit']}
			/>
		{:else if card === 'large'}
			<Large
				{post}
				on:display={() => {
					updateLatestPostInView(i);
				}}
				on:open={openPost}
				show={['subreddit']}
			/>
		{/if}
	{/each}
</div>
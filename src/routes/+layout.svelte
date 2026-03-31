<script>
	import './layout.css';
	let { children } = $props();
</script>

<svelte:head><link rel="icon" href="./images/bansi1_no_bg.png" /></svelte:head>
{@render children()}

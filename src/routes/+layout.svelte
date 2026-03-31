<script>
	import './layout.css';
	let { children } = $props();
</script>

<svelte:head><link rel="icon" href="./images/nunnos.png" /></svelte:head>
{@render children()}

<script>
	import { globalState } from '$lib/globalState.svelte.js';
	import { i18n } from '$lib/i18n.js';
	let t = $derived(i18n[globalState.language] || i18n['KR']);
	let { isModal = $bindable(false), header = '제목', children, footer } = $props();
	const closeModal = () => {
		isModal = false;
	};
</script>

{#if isModal}
	<div
		class="fixed inset-0 z-99 flex items-center justify-center bg-black/30 backdrop-blur-sm"
		onclick={closeModal}
	>
		<div
			class="w-11/12 max-w-xl rounded-xl bg-white p-4 shadow-2xl dark:bg-gray-800 dark:text-white"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="flex items-center justify-between">
				<div class="text-xl font-bold">{header}</div>
				<button class="my-font cursor-pointer text-3xl" onclick={closeModal}>✕</button>
			</div>
			<hr class="-mx-4 my-4 border border-gray-500" />
			<div class="max-h-[70vh] overflow-y-auto my-font">
				{@render children()}
			</div>
			<hr class="-mx-4 my-4 border border-gray-500" />
			<div class="flex items-center justify-end">
				{#if footer}
					<!-- 부모가 커스텀 HTML(버튼들)을 넘겼다면 그걸 그대로 출력 -->
					{@render footer()}
				{:else}
					<button class="my-btn" onclick={closeModal}>
						{t.btnOk}
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- 사용방법 메모 - 푸터 없이 확인버튼만 -->
<!--
<Modal bind:isModal={isWarningsModal} header={t.warningTitle} >
	<div class="flex flex-col gap-2">
		<div>
			<img src="{base}/images/svt.png" class="w-150" alt="svt" />
		</div>
	</div>
</Modal>
-->

<!-- 사용방법 메모 - 푸터에 직접 넣기-->
<!--
<Modal bind:isModal={isManualModal} header={t.howtouse}>
	<div class="flex flex-col gap-1">
		<div>{t.manualGuide.step1_title}</div>
		<img src="{base}/images/manual1.png" class="w-150" alt="sample1" />
	</div>

	{#snippet footer()}
		<button
			class="rounded-lg bg-gray-300 px-5 py-2 text-sm text-black"
			onclick={() => (isManualModal = false)}
		>
			취소
		</button>
		<button
			class="rounded-lg bg-green-600 px-5 py-2 text-sm text-white"
			onclick={() => {
				alert('적용되었습니다!');
				isManualModal = false;
			}}
		>
			적용하기
		</button>
	{/snippet}
</Modal>
-->

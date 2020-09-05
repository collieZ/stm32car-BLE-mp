<template>
	<view class="">
		<view class=""><u-action-sheet :list="list" v-model="show"></u-action-sheet></view>
		<button type="default" @click="show = true">show</button>
	</view>
</template>

<script>
export default {
	data() {
		return {
			list: [
				{
					text: '点赞',
					color: 'blue',
					fontSize: 28
				},
				{
					text: '分享'
				},
				{
					text: '评论'
				}
			],
			show: true
		};
	},
	methods: {}
};
</script>

<style lang="scss">
page {
	background-color: $u-bg-color;
}
</style>
<style lang="scss" scoped></style>

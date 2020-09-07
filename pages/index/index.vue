<template>
	<view class="container">
		<u-popup v-model="showPopup" mode="bottom" safe-area-inset-bottom width="100%" height="60%" border-radius="14">
			<view style="height: 300px" class="BLE-list-container">
				<u-loading class="BLE-list-loading" size="40" color="primary" :show="BLElistLoading"></u-loading>
				<view class="sa-container">
					<u-swipe-action
						v-if="showPopup && list.length"
						vibrate-short
						v-for="(item, index) of list"
						:index="index"
						:show="item.show"
						:key="item.id"
						@click="SAclick($event, item)"
						@open="SAopen"
						:options="item.SAoptions"
					>
						<view class="item u-border-bottom">
							<image mode="aspectFill" :src="item.images" />
							<!-- 此层wrap在此为必写的，否则可能会出现标题定位错误 -->
							<view class="title-wrap">
								<text class="title u-line-1">{{ item.name }}</text>
								<view class="">
									<text class="u-line-2">RSSI: {{ item.RSSI }}</text>
								</view>
							</view>
						</view>
					</u-swipe-action>
				</view>
			</view>
		</u-popup>
		<u-button v-if="!BLEEntity" @click="initBLE">初始化蓝牙</u-button>
		<u-button v-show="canSearchBle" :loading="isSearching" :disabled="canCloseBLEAdapterSearch" @click="searchBLE">搜寻蓝牙</u-button>
		<u-button :disabled="!canCloseBLEAdapterSearch" @click="closeBLEAdapterSearch">停止蓝牙搜索</u-button>
		<u-button @click="showPopup = true">弹出蓝牙列表</u-button>
		<!-- <navigator url="../my/index">my页面</navigator> -->
	</view>
</template>

<script>
const msgpack = require("msgpack-lite");
import { BLEentity } from '../../utils/BLE.js';
import { mapState } from 'vuex';
export default {
	data() {
		return {
			BLEEntity: null,
			isSearching: false,
			showPopup: false,
			canCloseBLEAdapterSearch: false, // 是否能关闭蓝牙适配器搜寻
			canCloseBLEAdapter: false, // 是否能关闭蓝牙适配器
			canSearchBle: true, // 是否可以搜寻蓝牙
			currentDeviceId: '', // 当前连接的蓝牙设备id
			// currentConnectedIdx: 0,	// 当前连接蓝牙的序号
			currentExpandDevId: '', // 当前展开的蓝牙设备ID
			list: [] // 蓝牙列表
		};
	},
	onLoad() {
		this.initBLECallback();
		console.log(msgpack.encode({"name": "zzw"}), 'json!!')
	},
	beforeDestroy() {
		console.log('卸载页面');
	},
	computed: {
		...mapState(['devices', 'connected', 'deviceId']),
		// 蓝牙列表搜索加载状态
		BLElistLoading: function() {
			if (this.isSearching && this.showPopup && this.devices.length === 0) {
				return true;
			}
			return false;
		}
	},
	watch: {
		devices: {
			handler: function(val) {
				this.list = val.map((item, index) => {
					let SAoptions = [
						{
							text: '连接',
							style: {
								backgroundColor: '#007aff'
							}
						}
					];
					const temp = {
						id: index,
						images: 'https://cdn.uviewui.com/uview/common/logo.png',
						show: this.currentExpandDevId === item.deviceId ? true : false,
						SAoptions,
						...item
					};
					return temp;
				});
			},
			deep: true
		}
	},
	methods: {
		// 初始化蓝牙适配器并搜寻附近蓝牙设备
		initBLE() {
			this.isSearching = true;
			this.BLEEntity = BLEentity;
			if (this.BLEEntity) {
				this.BLEEntity.init();
			}
		},
		initBLECallback() {
			uni.$on('BLEconnect', data => {
				// 弹出列表框显示搜寻的蓝牙设备 (loading...效果)
				this.isSearching = false;
				this.canCloseBLEAdapterSearch = true;
				this.showPopup = true;
			});
			uni.$on('connected', async () => {
				this.canSearchBle = false;
				for (let item of this.list) {
					if (item.deviceId === this.deviceId && this.connected) {
						console.log('连接上蓝牙');
						item.show = false;
						item.SAoptions[0] = {
							text: '断开',
							style: {
								backgroundColor: '#dd524d'
							}
						};
						break;
					}
				}
				this.list = this.list.filter(item => item.deviceId === this.deviceId);
				this.$u.toast(`连接成功!`);
				this.isSearching = false;
				this.canCloseBLEAdapterSearch = false;
				this.showPopup = false;
			});
			uni.$on('disconnect', () => {
				this.$u.toast(`已断开连接!`);
				this.BLEEntity.closeBLEConnection();
				this.canSearchBle = true;
				this.showPopup = false;
			});
		},
		searchBLE() {
			if (this.BLEEntity) {
				this.isSearching = true;
				this.BLEEntity.startBluetoothDevicesDiscovery();
			}
		},
		closeBLEAdapterSearch() {
			if (this.BLEEntity) {
				this.BLEEntity.stopBluetoothDevicesDiscovery();
				this.canCloseBLEAdapterSearch = false;
			}
		},
		SAclick(index, item) {
			// uni.$on('connected', () => {
			// 	this.canSearchBle = false;
			// 	this.list[index].show = false;
			// 	for (let item of this.list) {
			// 		if (item.deviceId === this.deviceId && this.connected) {
			// 			item.SAoptions[0] = {
			// 				text: '断开',
			// 				style: {
			// 					backgroundColor: '#dd524d'
			// 				}
			// 			};
			// 		}
			// 		break;
			// 	}
			// 	this.list = this.list.filter(item => item.deviceId === this.deviceId);
			// 	this.$u.toast(`连接成功!`);
			// 	this.isSearching = false;
			// 	this.canCloseBLEAdapterSearch = false;
			// 	this.showPopup = false;
			// });
			// uni.$on('disconnect', () => {
			// 	this.$u.toast(`已断开连接!`);
			// 	this.BLEEntity.startBluetoothDevicesDiscovery();
			// 	this.canSearchBle = true;
			// 	this.showPopup = false;
			// });
			this.currentConnectedIdx = index;
			if (item.SAoptions[0].text === '连接') {
				this.BLEEntity.createBLEConnection(item); // 建立蓝牙连接
			} else {
				this.BLEEntity.closeBLEConnection(); // 关闭蓝牙连接
			}
		},
		// 如果打开一个的时候，不需要关闭其他，则无需实现本方法
		SAopen(index) {
			this.currentExpandDevId = this.list[index].deviceId;
			// 先将正在被操作的swipeAction标记为打开状态，否则由于props的特性限制，
			// 原本为'false'，再次设置为'false'会无效
			this.list[index].show = true;
			this.list.forEach((val, idx) => {
				if (index != idx) val.show = false;
			});
			this.list = [...this.list];
			console.log('open new one===>', this.list);
		}
	}
};
</script>

<style lang="scss">
page {
	background-color: $u-bg-color;
}
</style>
<style lang="scss" scoped>
.container {
	padding: 20px;
	font-size: 14px;
	line-height: 24px;
}

.BLE-list-container {
	padding: 40rpx 25rpx;
	.BLE-list-loading {
		display: block;
		position: absolute;
		top: 50%;
		left: 50%;
	}
	.sa-container {
		.item {
			display: flex;
			position: relative;
			padding: 20rpx;
		}

		image {
			width: 120rpx;
			flex: 0 0 120rpx;
			height: 120rpx;
			margin-right: 20rpx;
			border-radius: 12rpx;
		}
		.title {
			text-align: left;
			font-size: 28rpx;
			color: $u-content-color;
			margin-top: 5rpx;
		}
	}
}
</style>

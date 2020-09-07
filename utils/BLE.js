import store from '../store/index.js'

/**
 * arr 要查询的数组、key 要查询对象的属性、 要查询的值
 * 判断某个值是否在数组中，并返回位置
 * */
function inArray(arr, key, val) {
	for (let i = 0; i < arr.length; i++) {
		if (arr[i][key] === val) {
			return i;
		}
	}
	return -1;
}

// ArrayBuffer转16进度字符串示例
function ab2hex(buffer) {
	var hexArr = Array.prototype.map.call(
		new Uint8Array(buffer),
		function(bit) {
			return ('00' + bit.toString(16)).slice(-2)
		}
	)
	return hexArr.join('');
}

/**
 * @description  初始化蓝牙
 * */
class BLE {
	constructor(arg) {
		this._discoveryStarted = false; // 蓝牙搜索全局变量
		this._deviceId = '' // 设备id
		this._serviceId = '' // 服务id
		this._characteristicId = '' // 特征值id
	}



	init() {
		// 初始化蓝牙适配器
		uni.openBluetoothAdapter({
			success: (res) => {
				console.log('openBluetoothAdapter success', res)
				this.startBluetoothDevicesDiscovery() // 搜寻设备
			},
			fail: (res) => {
				if (res.errCode === 10001) {
					// 提示检查蓝牙是否可用
					wx.onBluetoothAdapterStateChange(function(res) {
						console.log('onBluetoothAdapterStateChange', res)
						if (res.available) {
							this.startBluetoothDevicesDiscovery() // 搜寻设备
						}
					})
				}
			}
		})
	}

	/**
	 * @description 适配器初始完成后，开始蓝牙设备搜寻
	 * */
	startBluetoothDevicesDiscovery() {
		console.log('souxun BLE==>', this._discoveryStarted)
		if (this._discoveryStarted) {
			return
		}
		this._discoveryStarted = true
		uni.startBluetoothDevicesDiscovery({
			allowDuplicatesKey: false, // 不允许重复上报同一设备
			// services: [],	// 要搜索的蓝牙设备主 service 的 uuid 列表, 用于通过该参数过滤掉周边不需要处理的其他蓝牙设备。
			success: (res) => {
				console.log('startBluetoothDevicesDiscovery success', res)
				this.onBluetoothDeviceFound()
			},
		})
	}

	/**
	 * @description 设备搜结束后停止搜寻
	 * */
	stopBluetoothDevicesDiscovery() {
		uni.stopBluetoothDevicesDiscovery()
		this._discoveryStarted = false
	}

	/**
	 * @description  搜寻设备，并将新设备加入device数组
	 * */
	onBluetoothDeviceFound() { // 监听蓝牙搜寻结果事件
		uni.onBluetoothDeviceFound((res) => {
			res.devices.forEach(device => {
				if (!device.name && !device.localName) { // 都没有就退出
					return
				}
				const foundDevices = store.state.devices // 现存在vuex中的设备列表
				// 返回的deviceid在现有数组中的索引，没有则返回-1
				const idx = inArray(foundDevices, 'deviceId', device.deviceId)
				let data = []
				if (idx === -1) { // 如果是新发现的ble设备
					data = [...foundDevices, device] // 将新发现的设备device对象追加到数组末尾
				} else {
					// 如果是以前搜索到过的ble设备
					foundDevices[idx] = device // 更新之前有的对象值
					data = [...foundDevices]
				}
				store.commit('SET_DEVICES', data)
				uni.$emit('BLEconnect', data)
			})
		})
	}


	/**
	 * @description  建立BLE蓝牙设备连接
	 * */
	createBLEConnection(data) {
		const ds = data
		const deviceId = ds.deviceId
		const name = ds.name
		uni.createBLEConnection({
			deviceId,
			success: (res) => {
				console.log('连接上的蓝牙的信息: ', res)
				store.commit('SET_BLE_STATUS', {
					connected: true,
					name,
					deviceId,
				})
				this.getBLEDeviceServices(deviceId) // 获取设备服务列表
				uni.$emit('connected')	// 设置BLE蓝牙连接状态
			},
			complete: function(res) {
				// console.log('点击后连接返回的信息', res)
			}
		})
		this.stopBluetoothDevicesDiscovery() // 关闭蓝牙搜寻，节省资源
	}

	/**
	 * @description  关闭BLE连接
	 * */
	closeBLEConnection() {
		uni.closeBLEConnection({
			deviceId: store.state.deviceId
		})
		store.commit('RESET_BLE_STATUS')
		uni.$emit('disconnect')	// 断开蓝牙事件
	}

	/**
	 * @description  获取BLE设备服务列表
	 * @param {string} deviceId 
	 * */
	getBLEDeviceServices(deviceId) {
		uni.getBLEDeviceServices({
			deviceId,
			success: (res) => {
				console.log('该设备的服务有： ', res.services)
				for (let i = 0; i < res.services.length; i++) {
					if (res.services[i].isPrimary) { // 是否为主服务
						// 获取BLE该服务特征值characteristics 
						this.getBLEDeviceCharacteristics(deviceId, res.services[i].uuid)
						return
					}
				}
			}
		})
	}

	/**
	 * @description  获取BLE设备特征值
	 * @param {string} deviceId 设备Id
	 * @param {string} serviceId 服务Id
	 * */
	getBLEDeviceCharacteristics(deviceId, serviceId) {
		uni.getBLEDeviceCharacteristics({
			deviceId,
			serviceId,
			success: (res) => {
				console.log('getBLEDeviceCharacteristics success', res.characteristics)
				// 遍历主服务中的每个特征值
				for (let i = 0; i < res.characteristics.length; i++) {
					let item = res.characteristics[i]
					if (item.properties.read) { // 如果可读
						// 读取该特征值的属性信息，在change回调中取得读取的值
						uni.readBLECharacteristicValue({
							deviceId,
							serviceId,
							characteristicId: item.uuid, // 特征值的uuid
						})
					}
					if (item.properties.write) { // 如果可写
						store.commit('SET_WRITE_STATUS', {
							canWrite: true
						})
						// 将可写设备的设备id 服务id 特征值id记录，并启动写操作
						this._deviceId = deviceId
						this._serviceId = serviceId
						this._characteristicId = item.uuid
						this.writeBLECharacteristicValue()
					}
					// 该特征值是否支持通知或者指示
					if (item.properties.notify || item.properties.indicate) {
						uni.notifyBLECharacteristicValueChange({
							deviceId,
							serviceId,
							characteristicId: item.uuid,
							state: true, // 是否启用notify
						})
					}
				}
			},
			fail(res) {
				console.error('getBLEDeviceCharacteristics', res)
			}
		})
		// 立即监听，保证第一时间获取数据
		uni.onBLECharacteristicValueChange((characteristic) => {
			const idx = inArray(store.state.chs, 'uuid', characteristic.characteristicId)
			let data = []
			if (idx === -1) {
				// 原来数组中不存在，追加chs数据到末尾
				data = [...store.state.chs, {
					uuid: characteristic.characteristicId,
					value: ab2hex(characteristic.value)
				}]
			} else {
				const tempData = store.state.chs.map(item => JSON.parse(JSON.stringify(item)))
				tempData[idx] = {
					uuid: characteristic.characteristicId,
					value: ab2hex(characteristic.value)
				}
				data = tempData
			}
			console.log(data, '传来数据', store.state.canWrite)
			store.commit('SET_CHS', data)	// uuid、value
		})
	}


	/**
	 * @description  向蓝牙特征值写入数据
	 * */
	writeBLECharacteristicValue() {
		// 向蓝牙设备发送一个0x00的16进制数据
		let buffer = new ArrayBuffer(1) // 生成一字节的类型化数组
		let dataView = new DataView(buffer) // 转换成数组视图
		dataView.setUint8(0, 0) // 写入内存,从第一个字节开始
		uni.writeBLECharacteristicValue({
			deviceId: this._deviceId,
			serviceId: this._serviceId,
			characteristicId: this._characteristicId,
			value: buffer,
			success: (res) => {
				console.log('写入成功', res)
			}
		})
	}

	/**
	 * @description  关闭蓝牙适配器
	 * */
	closeBluetoothAdapter() {
		uni.closeBluetoothAdapter()
		this._discoveryStarted = false
	}
}

export const BLEentity = new BLE()

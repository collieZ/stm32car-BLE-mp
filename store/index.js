import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

const store = new Vuex.Store({
	state: {
		vuex_token: '',
		// BlE蓝牙状态参数
		name: '',
		deviceId: '',
		canWrite: false,
		connected: false,
		devices: [],
		chs: [],
	},
	mutations: {
		SET_DEVICES(state, payload) {
			state.devices = payload
		},
		SET_BLE_STATUS(state, payload) {
			state.name = payload.name
			state.deviceId = payload.deviceId
			state.connected = payload.connected
		},
		SET_WRITE_STATUS(state, payload) {
			state.canWrite = payload.canWrite
		},
		SET_CHS(state, payload) {
			state.chs = payload
		},
		RESET_BLE_STATUS(state) {
			state.canWrite = false
			state.connected = false
			state.chs = []
		}
	}
})

export default store

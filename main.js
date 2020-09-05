import Vue from 'vue'
import App from './App'
import store from '@/store';
import uView from "uview-ui";
Vue.use(uView);

const EventBus = new Vue()

Vue.config.productionTip = false
// window.eventBus = EventBus	// 数据总线

App.mpType = 'app'

const app = new Vue({
	store,
	...App
})
app.$mount()

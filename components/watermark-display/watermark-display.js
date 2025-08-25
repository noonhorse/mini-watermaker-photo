Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 当前选中的水印ID
    watermarkId: {
      type: String,
      value: 'default'
    },
    // 是否显示水印
    visible: {
      type: Boolean,
      value: true
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    title: undefined,
    // 当前时间
    weekday: '',
    currentTime: '',
    currentDate: '',
    currentLocation: '深圳市·莲花山公园'
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 更新时间
    updateTime() {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
      const weekday = weekdays[now.getDay()];
      
      this.setData({
        currentTime: `${hours}:${minutes}`,
        weekday: `${weekday}`,
        currentDate: `${year}.${month}.${day}`
      });
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 组件实例进入页面节点树时执行
      this.updateTime();
      // 每分钟更新一次时间
      this.timeInterval = setInterval(() => {
        this.updateTime();
      }, 60000);
    },
    detached() {
      // 组件实例被从页面节点树移除时执行
      if (this.timeInterval) {
        clearInterval(this.timeInterval);
      }
    }
  }
});
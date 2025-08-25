Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    }
  },
  data: {
    selectedId: 'style1',
    watermarkStyles: [
      {
        id: 'default',
        name: '默认样式',
        preview: '/static/watermark-previews/default.png'
      },
      {
        id: 'engineering',
        name: '工程记录',
        preview: '/static/watermark-previews/engineering.png'
      },
      {
        id: 'time_card',
        name: '时间卡片',
        preview: '/static/watermark-previews/time_card.png'
      },
      {
        id: 'environment',
        name: '环境治理',
        preview: '/static/watermark-previews/environment.png'
      },
      {
        id: 'simple_time',
        name: '简约时间',
        preview: '/static/watermark-previews/simple_time.png'
      },
      {
        id: 'temperature',
        name: '温度显示',
        preview: '/static/watermark-previews/temperature.png'
      },
      {
        id: 'work_record',
        name: '工作记录',
        preview: '/static/watermark-previews/work_record.png'
      },
      {
        id: 'blue_card',
        name: '蓝色卡片',
        preview: '/static/watermark-previews/blue_card.png'
      }
    ]
  },
  methods: {
    hidePanel() {
      this.triggerEvent('onclose');
    },
    onSelect(event) {
      const selectedId = event.currentTarget.dataset.id;
      this.setData({ selectedId });
      this.triggerEvent('onselect', { watermarkId: selectedId });
      this.hidePanel();
    }
  }
});
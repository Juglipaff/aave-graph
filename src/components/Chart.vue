<script>
// @ is an alias to /src

import { Line, mixins } from 'vue-chartjs'
import zoom from 'chartjs-plugin-zoom'
import DownsamplePlugin from 'chartjs-plugin-downsample'
const { reactiveProp } = mixins
export default {
  extends: Line,
  mixins: [reactiveProp],
  props: {
    chartData: { type: Object },
    options: { type: Object }
  },
  mounted () {
    this.addPlugin({
      DownsamplePlugin,
      beforeInit: function (chart) {
        chart.options.downsample = {
          enabled: true,
          auto: false,
          onInit: false,
          preferOriginalData: false,
          restoreOriginalData: false,
          targetDatasets: []
        }
      },
      beforeUpdate: function (chart) {
        chart.downsample(1000)
      }
    })
    this.addPlugin(zoom)
    this.renderChart(this.chartData, this.options)
  }
}
</script>

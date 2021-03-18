<script>
// @ is an alias to /src

import { Line, mixins } from 'vue-chartjs'
const { reactiveProp } = mixins
export default {
  extends: Line,
  mixins: [reactiveProp],
  props: {
    chartData: { type: Object },
    options: { type: Object }
  },
  mounted () {
    this.renderChart(this.chartData, this.options)
  }
}
</script>

<template>
  <div>
    <div class="w-96 mb-2">
      <input
        :value="search"
        type="search"
        class="h-12 p-4 mb-1 w-full bg-white border-2 border-gray-300 rounded-full"
        placeholder="Busca por el nombre de la diseñadora"
        aria-label="Busca por el nombre de la diseñadora"
        @input="handleSearch"
      >
    </div>
    <div class="mb-4 w-full">
      <div class="flex flex-wrap items-center w-full text-gray-800">
        <button
          class="bg-gray-400 rounded-full px-3 py-2 font-medium text-center text-sm m-1 hover:bg-gray-500 hover:text-white"
          :class="{ 'bg-custom text-white hover:bg-indigo-800' : status === 'all' }"
          @click="handleStatusFilter('all')"
        >
          Todas
        </button>
        <button
          class="bg-gray-400 rounded-full px-3 py-2 font-medium text-center text-sm m-1 hover:bg-gray-500 hover:text-white"
          :class="{ 'bg-yellow-500 text-white hover:bg-yellow-600' : status === 'pioneras' }"
          @click="handleStatusFilter('pioneras')"
        >
          Pioneras
        </button>
        <button
          class="bg-gray-400 rounded-full px-3 py-2 font-medium text-center text-sm m-1 hover:bg-gray-500 hover:text-white"
          :class="{ 'bg-green-500 text-white hover:bg-green-600' : status === 'contemporaneas' }"
          @click="handleStatusFilter('contemporaneas')"
        >
          Contemporáneas
        </button>


      </div>
    </div>

  </div>
</template>

<script>
import { debounce } from '~/helpers/index'
export default {
  data () {
    return {
      orderOpen: false,
      orderChanged: false
    }
  },
  mounted () {
    this.handleStatusFilter('all')
  },
  computed: {
    search () {
      return this.$store.state.filter.search
    },
    status () {
      return this.$store.state.filter.status
    },


  },
  methods: {
    handleStatusFilter (status) {
      this.$store.dispatch('filterStatus', status)
    },
    handleSearch: debounce(function (e) {
      this.$store.dispatch('filterSearch', e.target.value)
    }, 500),

  }
}
</script>

<style lang="postcss" scoped>
.bg-custom{
  background-color: #9516ff;
}

</style>

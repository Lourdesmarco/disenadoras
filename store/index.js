export const state = () => ({
  disenadoras: [
    {
      id: 1,
      nombre: "Anne Sophie Oberkrome",
      path: "annesophie_oberkrome_mario/index.html",
      autor: "Mario Herreros",
      especialidad: "producto",
      grupo: "pioneras",
      activa: false
    },
    {
      id: 2,
      nombre: "Emilia Wickstead",
      path: "emilia_wickstead_laura/index.html",
      autor: "Laura Molina",
      especialidad: "moda",
      grupo: "pioneras",
      activa: false
    },
    {
      id: 3,
      nombre: "Gae Aulenti",
      path: "gae_aulenti_marina/index.html",
      autor: "Marina Herreros",
      especialidad: "producto",
      especialidad2: "interiores",
      grupo: "pioneras",
      activa: false
    },
    {
      id: 4,
      nombre: "Ilse Crawford",
      path: "ilse_crawford_diego/index.html",
      autor: "Diego de Paz",
      especialidad: "interiores",
      grupo: "contemporaneas",
      activa: true
    },
    {
      id: 5,
      nombre: "India Maldhavi",
      path: "india_maldhavi_luna/index.html",
      autor: "Luna Enciso",
      especialidad: "interiores",
      grupo: "pioneras",
      activa: false
    },
    {
      id: 6,
      nombre: "Iris Apfel",
      path: "iris_apfel_marta/index.html",
      autor: "Marta Casado",
      especialidad: "moda",
      grupo: "pioneras",
      activa: false
    },
    {
      id: 7,
      nombre: "Kelly Wearstler",
      path: "kelly_wearstler_virginia/index.html",
      autor: "Virginia García",
      especialidad: "interiores",
      grupo: "pioneras",
      activa: false
    },
    {
      id: 8,
      nombre: "Lina Bo Bardi",
      path: "lina_bobardi_irene/index.html",
      autor: "Irene Ruiz",
      especialidad: "producto",
      especialidad: "interiores",
      grupo: "pioneras",
      activa: true
    },
    {
      id: 9,
      nombre: "Lotta Agaton",
      path: "lotta_agaton_clara/index.html",
      autor: "Clara Fen",
      especialidad: "interiores",
      grupo: "contemporaneas",
      activa: false
    },
    {
      id: 10,
      nombre: "Matali Crasset",
      path: "matali_crasset_carolina/index.html",
      autor: "Carolina Schueg",
      especialidad: "producto",
      especialidad2: "interiores",
      grupo: "pioneras",
      activa: false
    },
    {
      id: 11,
      nombre: "Nani Marquina",
      path: "nani_marquina_david/index.html",
      autor: "David Agüero",
      especialidad: "producto",
      grupo: "pioneras",
      activa: false
    },
    {
      id: 12,
      nombre: "Nanna Ditzel",
      path: "nanna_ditzel_carla/index.html",
      autor: "Carla Coulbois",
      especialidad: "producto",
      grupo: "pioneras",
      activa: false
    },
    {
      id: 13,
      nombre: "Patricia Urquiola",
      path: "patricia_urquiola_angel/index.html",
      autor: "Ángel Martínez",
      especialidad: "interiores",
      grupo: "contemporaneas",
      activa: true
    },
    {
      id: 14,
      nombre: "Reiko Tanabe",
      path: "reiko_tanabe_saul/index.html",
      autor: "Saúl Valdivielso",
      especialidad: "producto",
      grupo: "pioneras",
      activa: false
    },
    {
      id: 15,
      nombre: "Vivienne Westwood",
      path: "vivienne_westwood_sandra/index.html",
      autor: "Sandra Cebrián",
      especialidad: "moda",
      grupo: "pioneras",
      activa: false
    },
    {
      id: 16,
      nombre: "Aino Aalto",
      path: "aino_aalto_qiuping/index.html",
      autor: "Qiuping Zhang",
      especialidad: "producto",
      especialidad2: "interiores",
      grupo: "pioneras",
      activa: true
    },
    {
      id: 17,
      nombre: "Annie Atkins",
      path: "annie_atkins_ruben/index.html",
      autor: "Rubén Rodríguez",
      especialidad: "grafico",
      grupo: "contemporaneas",
      activa: true
    },
    {
      id: 18,
      nombre: "Carolyn Davidson",
      path: "carolyn_davidson_walter/index.html",
      autor: "Walter López",
      especialidad: "grafico",
      grupo: "contemporaneas",
      activa: true
    },
    {
      id: 19,
      nombre: "Clara Montagut",
      path: "clara_montagut_cecilia/index.html",
      autor: "Cecilia Bao Damián",
      especialidad: "grafico",
      grupo: "contemporaneas",
      activa: true
    },
    {
      id: 20,
      nombre: "Donatella Versace",
      path: "donatella_versace_fernando/index.html",
      autor: "Fernando Ortega",
      especialidad: "moda",
      grupo: "contemporaneas",
      activa: true
    },
    {
      id: 21,
      nombre: "Ethel Reed",
      path: "ethel_reed_antonio/index.html",
      autor: "Antonio Clemente",
      especialidad: "grafico",
      grupo: "pioneras",
      activa: true
    },
    {
      id: 22,
      nombre: "Florence Knoll",
      path: "florence_knoll_javier/index.html",
      autor: "Javier Labaig",
      especialidad: "producto",
      grupo: "pioneras",
      activa: true
    },
    {
      id: 23,
      nombre: "Jacqueline Casey",
      path: "jacqueline_casey_selena/index.html",
      autor: "Selena Prada",
      especialidad: "grafico",
      grupo: "pioneras",
      activa: true
    },
    {
      id: 24,
      nombre: "Marta Cerdá",
      path: "marta_cerda_aitana/index.html",
      autor: "Aitana Carballo",
      especialidad: "grafico",
      grupo: "contemporaneas",
      activa: true
    },
    {
      id: 25,
      nombre: "Nina Vatolina",
      path: "nina_vatolina_luis/index.html",
      autor: "Luis Roldán",
      especialidad: "grafico",
      grupo: "pioneras",
      activa: true
    }




  ],
  filtradas: [],
  disenadora: {},
  filter: {
    search: '',
    status: 'all',
  }
})


export const actions = {
  async filterStatus ({ commit, dispatch }, status) {
    await commit('setFilterStatus', status)
    dispatch('filterDesigners')
  },
  async filterSearch ({ commit, dispatch }, search) {
    await commit('setFilterSearch', search)
    dispatch('filterDesigners')
  },
  async filterDesigners ({ commit }) {
    await commit('filterDesigners')
  }
}

import * as Filters from '~/helpers/filters'

export const mutations = {
  setFilteredDesigners (state, disenadoras) { state.filtradas = disenadoras },
  setFilterStatus (state, status) { state.filter.status = status },
  setFilterSearch (state, search) { state.filter.search = search },
  filterDesigners (state) {
    const disenadoras = [...state.disenadoras]
    state.filtradas = disenadoras
    state.filtradas = Filters.filterDesigners(state.filter, disenadoras)
  }
}

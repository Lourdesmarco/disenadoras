export function filterDesigners (filter, disenadoras) {
  let filteredList = [...disenadoras]

  // Filter status
  if (filter.status !== 'all') {
    const filtered = filteredList.filter(disenadora => disenadora.grupo === filter.status)
    filteredList = filtered
  }

  // Search
  if (filter.search !== '') {
    const searchList = []
    const searchTerm = filter.search.toLowerCase()
    for (let i = 0; i < filteredList.length; i++) {
      if (filteredList[i].nombre !== null && filteredList[i].nombre.toLowerCase().includes(searchTerm)) {
        searchList.push(filteredList[i])
      }
    }
    filteredList = searchList
  }

  return filteredList
}

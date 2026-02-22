const KEY = 'saved_trips_v1'

export function loadSavedTrips(){
  try{ return JSON.parse(localStorage.getItem(KEY) || '[]') }catch{ return [] }
}
export function saveTrip(trip){
  const list = loadSavedTrips()
  list.push({ id: Date.now().toString(), ...trip })
  localStorage.setItem(KEY, JSON.stringify(list))
}
export function removeTrip(id){
  const list = loadSavedTrips().filter(t=>t.id!==id)
  localStorage.setItem(KEY, JSON.stringify(list))
}

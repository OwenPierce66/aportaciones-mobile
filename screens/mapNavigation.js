/**
 * screens/mapNavigation.js
 *
 * El Mapa es una pestaña suelta: las aportaciones se abren en la pila de Aportaciones.
 */
export const openMapTask = (navigation, task) => {
  navigation.navigate('Tasks', { screen: 'TaskDetail', params: { taskId: task.id } });
};

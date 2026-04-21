import { View, Text, Modal, Pressable, Dimensions } from "react-native"
import { Feather } from "@expo/vector-icons"

const { width, height } = Dimensions.get("window")

export default function MapModal({ visible, onClose, latitud, longitud, nombreCliente, credito }) {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View className="flex-1 bg-black/50 justify-center items-center p-4">
                <View
                    className="bg-white rounded-3xl p-6 w-full shadow-2xl"
                    style={{ maxHeight: height * 0.85, maxWidth: width * 0.95 }}
                >
                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-4">
                        <View className="flex-1 mr-4">
                            <Text className="text-xl font-bold text-gray-800">
                                Ubicación del Pago
                            </Text>
                            <Text className="text-base text-gray-600 mt-1">{nombreCliente}</Text>
                            <Text className="text-sm text-gray-500">Crédito: {credito}</Text>
                        </View>
                        <Pressable
                            onPress={onClose}
                            className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center"
                        >
                            <Feather name="x" size={20} color="#6B7280" />
                        </Pressable>
                    </View>

                    {/* Coordenadas */}
                    <View className="mb-4 p-3 bg-purple-50 rounded-xl">
                        <Text className="text-sm text-purple-700 font-medium">Coordenadas GPS</Text>
                        <Text className="text-base text-purple-800 mt-1">
                            Lat: {latitud} | Lng: {longitud}
                        </Text>
                    </View>

                    {/* Mapa - Para desarrollo mostramos las coordenadas */}
                    <View
                        className="bg-gray-100 rounded-xl justify-center items-center border-2 border-purple-200"
                        style={{ height: height * 0.5 }}
                    >
                        <View className="items-center">
                            <View className="w-16 h-16 rounded-full bg-purple-100 justify-center items-center mb-4">
                                <Feather name="map-pin" size={32} color="#8B5CF6" />
                            </View>
                            <Text className="text-lg font-bold text-gray-800 mb-2">
                                Ubicación del Pago
                            </Text>
                            <Text className="text-base text-gray-600 text-center mb-4">
                                El pago fue registrado en esta ubicación
                            </Text>
                            <View className="bg-white p-3 rounded-lg border border-gray-200">
                                <Text className="text-sm text-gray-600">Latitud: {latitud}</Text>
                                <Text className="text-sm text-gray-600">Longitud: {longitud}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Botón para abrir en aplicación de mapas */}
                    <Pressable
                        className="mt-4 bg-purple-600 rounded-xl p-4 flex-row justify-center items-center"
                        onPress={() => {
                            // Abrir en aplicación de mapas nativa
                            const url = `https://maps.google.com/?q=${latitud},${longitud}`
                            // En desarrollo, solo mostrar alerta
                            alert(`Abrir en mapas: ${url}`)
                        }}
                    >
                        <Feather name="external-link" size={20} color="white" className="mr-2" />
                        <Text className="text-white font-semibold text-base ml-2">
                            Abrir en Aplicación de Mapas
                        </Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    )
}

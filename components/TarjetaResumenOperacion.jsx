import { useState, useEffect } from "react"
import { View, Text, Pressable, Animated } from "react-native"
import { Feather } from "@expo/vector-icons"
import numeral from "numeral"

export default function TarjetaResumenOperacion({
    operacion,
    expandida,
    onToggle,
    onVerUbicacion
}) {
    const [animatedHeight] = useState(new Animated.Value(expandida ? 1 : 0))
    const [contentHeight, setContentHeight] = useState(0)

    useEffect(() => {
        const toValue = expandida ? 1 : 0

        Animated.timing(animatedHeight, {
            toValue,
            duration: 300,
            useNativeDriver: false
        }).start()
    }, [expandida])

    const expandedHeight = animatedHeight.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.max(contentHeight, 100)]
    })

    const opacity = animatedHeight.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1]
    })

    const handleContentLayout = (event) => {
        const { height } = event.nativeEvent.layout
        setContentHeight(height)
    }

    return (
        <Pressable
            onPress={onToggle}
            className={`bg-white rounded-2xl shadow-md p-4 mb-4 border ${
                operacion._esPendiente ? "border-orange-400 border-2" : "border-gray-200"
            }`}
        >
            {/* Badge de pago pendiente */}
            {operacion._esPendiente && (
                <View className="absolute top-2 right-2 bg-orange-500 px-2 py-1 rounded-full flex-row items-center">
                    <Feather name="clock" size={12} color="white" />
                    <Text className="text-white text-xs font-semibold ml-1">En local</Text>
                </View>
            )}

            <View className="flex-row justify-between items-center">
                <View className="flex-1">
                    <Text className="font-semibold text-base">
                        {operacion.nombre || "No disponible"}
                    </Text>
                    <Text className="text-gray-600 text-sm mb-1">
                        Crédito: {operacion.cdgns} • Ciclo: {operacion.ciclo}
                    </Text>
                    <Text className="text-gray-600 text-sm mb-1">Fecha: {operacion.fecha}</Text>
                    <View className="flex-row items-center">
                        <View className="px-2 py-1 rounded-full mr-2 bg-blue-100">
                            <Text className="text-xs font-medium text-blue-700">
                                {operacion.tipo}
                            </Text>
                        </View>
                    </View>
                </View>
                <View className="items-end">
                    <Text className="text-sm text-gray-500">Monto</Text>
                    <Text className="font-semibold text-base">
                        {isNaN(parseFloat(operacion.monto))
                            ? operacion.monto
                            : numeral(operacion.monto).format("$0,0.00")}
                    </Text>
                    <Animated.View
                        style={{
                            transform: [
                                {
                                    rotate: animatedHeight.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ["0deg", "180deg"]
                                    })
                                }
                            ]
                        }}
                    >
                        <Feather name="chevron-down" size={20} color="#6B7280" />
                    </Animated.View>
                </View>
            </View>

            <Animated.View
                style={{
                    height: expandedHeight,
                    opacity: opacity,
                    overflow: "hidden"
                }}
            >
                <View
                    className="mt-3 pt-3 border-t border-gray-200 border-dashed"
                    onLayout={handleContentLayout}
                >
                    <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                            <Text className="text-sm text-gray-700 mb-1">
                                Fecha de registro: {operacion.fregistro}
                            </Text>
                            <Text className="text-sm text-gray-700 mb-1">
                                Secuencia: {operacion.secuencia}
                            </Text>

                            {operacion.comentarios_ejecutivo && (
                                <Text className="text-sm text-gray-700 mb-1">
                                    Comentarios: {operacion.comentarios_ejecutivo}
                                </Text>
                            )}
                        </View>
                        {/* <Pressable
                            onPress={() => onVerUbicacion(operacion)}
                            className="bg-purple-600 rounded-xl p-3 flex-row justify-center items-center"
                        >
                            <Feather name="map-pin" size={18} color="white" />
                            <Text className="text-white font-semibold text-base ml-2">
                                Ubicación
                            </Text>
                        </Pressable> */}
                    </View>
                </View>
            </Animated.View>
        </Pressable>
    )
}

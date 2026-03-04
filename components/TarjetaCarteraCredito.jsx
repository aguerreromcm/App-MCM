import { useState, useEffect } from "react"
import { View, Text, Pressable, Animated } from "react-native"
import { Feather } from "@expo/vector-icons"
import { router } from "expo-router"

import numeral from "numeral"
import { useDetalle } from "../context/DetalleContext"

export default function TarjetaCarteraCredito({ cliente, isExpanded, onToggle }) {
    const [animatedHeight] = useState(new Animated.Value(isExpanded ? 1 : 0))
    const [contentHeight, setContentHeight] = useState(0)
    const { establecerDatosDetalle } = useDetalle()

    useEffect(() => {
        const toValue = isExpanded ? 1 : 0

        Animated.timing(animatedHeight, {
            toValue,
            duration: 300,
            useNativeDriver: false
        }).start()
    }, [isExpanded])

    const expandedHeight = animatedHeight.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.max(contentHeight, 190)]
    })

    const opacity = animatedHeight.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1]
    })

    const handleContentLayout = (event) => {
        const { height } = event.nativeEvent.layout
        setContentHeight(height)
    }

    const handleNavigateToDetail = () => {
        const datosCredito = {
            noCredito: cliente.cdgns,
            ciclo: cliente.ciclo,
            nombre: cliente.nombre || "",
            diaPago: cliente.dia_pago || "",
            fechaDiaPago: cliente.fecha_dia_pago || "",
            saldoTotal: cliente.saldo_total || "0",
            cantEntregada: cliente.cant_entre || "0",
            tipoCartera: cliente.tipo_cartera || "",
            fechaInicio: cliente.inicio || "",
            diasMora: cliente.dias_mora?.toString() || "0",
            moraTotal: cliente.mora_total?.toString() || "0",
            fechaCalc: cliente.fecha_calc || "",
            adicional: cliente.adicional || 0
        }

        establecerDatosDetalle(datosCredito)
        router.push("/(screens)/DetalleCredito")
    }

    return (
        <Pressable
            onPress={onToggle}
            className="bg-white rounded-2xl shadow-md p-4 mb-4 border border-gray-200"
        >
            <View className="flex-row justify-between items-center">
                <View className="flex-1">
                    <Text className="font-semibold text-base">
                        {cliente.nombre || "No disponible"}
                    </Text>
                    <Text className="text-gray-600 text-sm mb-1">
                        Crédito: {cliente.cdgns} • Ciclo: {cliente.ciclo}
                    </Text>
                    <View className="flex-row items-center">
                        <View
                            className={`px-2 py-1 rounded-full mr-2 ${
                                cliente.tipo_cartera === "VIGENTE"
                                    ? "bg-green-100"
                                    : "bg-yellow-100"
                            }`}
                        >
                            <Text
                                className={`text-xs font-medium ${
                                    cliente.tipo_cartera === "VIGENTE"
                                        ? "text-green-700"
                                        : "text-yellow-700"
                                }`}
                            >
                                {cliente.tipo_cartera || "Sin estado"}
                            </Text>
                        </View>
                        {cliente?.adicional === 1 && (
                            <View className="px-2 py-1 rounded-full mr-2 bg-purple-100">
                                <Text className="text-xs font-medium text-purple-700">
                                    {cliente?.adicional === 1 ? "Adicional" : "Tradicional"}
                                </Text>
                            </View>
                        )}
                        {cliente.dias_mora > 0 && (
                            <View className="bg-red-100 px-2 py-1 rounded-full">
                                <Text className="text-xs font-medium text-red-700">
                                    {cliente.dias_mora} días en mora
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
                <View className="items-end">
                    <Text className="text-sm text-gray-500">Saldo</Text>
                    <Text className="font-semibold text-base">
                        {isNaN(parseFloat(cliente.saldo_total))
                            ? cliente.saldo_total
                            : numeral(cliente.saldo_total).format("$0,0.00")}
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
                                Fecha de inicio: {cliente.inicio || "N/D"}
                            </Text>
                            <Text className="text-sm text-gray-700 mb-1">
                                Día de pago: {cliente.dia_pago || "N/D"}
                            </Text>
                            <Text className="text-sm text-gray-700 mb-1">
                                Tipo de cartera: {cliente.tipo_cartera || "N/D"}
                            </Text>
                            <Text className="text-sm text-gray-700 mb-1">
                                Préstamo: {numeral(cliente.cant_entre).format("$0,0.00")}
                            </Text>
                            <Text className="text-sm text-gray-700 mb-1">
                                Saldo: {numeral(cliente.saldo_total).format("$0,0.00")}
                            </Text>
                            {cliente.dias_mora > 0 && (
                                <Text className="text-sm text-red-600 mb-1 font-medium">
                                    Días en mora: {cliente.dias_mora}
                                </Text>
                            )}
                            {cliente.mora_total > 0 && (
                                <Text className="text-sm text-red-600 mb-1 font-medium">
                                    Mora total: {numeral(cliente.mora_total).format("$0,0.00")}
                                </Text>
                            )}
                            {cliente.dias_mora > 0 && (
                                <Text className="text-sm text-red-600 mb-1 font-medium">
                                    Se pone al corriente con:{" "}
                                    {numeral(cliente.mora_total).format("$0,0.00")}
                                </Text>
                            )}
                        </View>
                        <Pressable
                            onPress={handleNavigateToDetail}
                            className="ml-3 p-2 bg-blue-50 rounded-full"
                        >
                            <Feather name="eye" size={16} color="#3B82F6" />
                        </Pressable>
                    </View>
                </View>
            </Animated.View>
        </Pressable>
    )
}

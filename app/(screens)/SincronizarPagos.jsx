import { useContext, useState, useEffect } from "react"
import {
    View,
    Text,
    Pressable,
    TextInput,
    FlatList,
    Image,
    Modal,
    ActivityIndicator
} from "react-native"
import { router } from "expo-router"
import { Feather, MaterialIcons } from "@expo/vector-icons"
import { SafeAreaInsetsContext } from "react-native-safe-area-context"
import { pagosPendientes, registroPagos } from "../../services"
import { useCustomAlert } from "../../hooks/useCustomAlert"
import CustomAlert from "../../components/CustomAlert"
import numeral from "numeral"

export default function SincronizarPagos() {
    const insets = useContext(SafeAreaInsetsContext)
    const { alertRef, showError, showSuccess, showInfo } = useCustomAlert()

    const [pagos, setPagos] = useState([])
    const [pagosFiltrados, setPagosFiltrados] = useState([])
    const [loading, setLoading] = useState(true)
    const [mostrarBusqueda, setMostrarBusqueda] = useState(false)
    const [terminoBusqueda, setTerminoBusqueda] = useState("")
    const [pagosSeleccionados, setPagosSeleccionados] = useState(new Set())
    const [modalComprobanteVisible, setModalComprobanteVisible] = useState(false)
    const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState(null)

    useEffect(() => {
        cargarPagos()
    }, [])

    // Efecto para filtrar pagos cuando cambia el término de búsqueda
    useEffect(() => {
        if (terminoBusqueda.length >= 3) {
            const filtrados = pagos.filter((pago) => {
                const nombreMatch = pago.nombreCliente
                    ?.toLowerCase()
                    .includes(terminoBusqueda.toLowerCase())
                const creditoMatch = pago.credito?.includes(terminoBusqueda)
                return nombreMatch || creditoMatch
            })
            setPagosFiltrados(filtrados)
        } else {
            setPagosFiltrados(pagos)
        }
    }, [terminoBusqueda, pagos])

    const cargarPagos = async () => {
        try {
            setLoading(true)
            const todosPagos = await pagosPendientes.obtenerTodos()
            setPagos(todosPagos)
            setPagosFiltrados(todosPagos)
            const todosIds = new Set(todosPagos.map((pago) => pago.id))
            setPagosSeleccionados(todosIds)
        } catch (error) {
            console.error("Error al cargar pagos:", error)
            showError("Error", "No se pudieron cargar los pagos pendientes", [
                { text: "OK", style: "default" }
            ])
        } finally {
            setLoading(false)
        }
    }

    const toggleSeleccionPago = (pagoId) => {
        const nuevosSeleccionados = new Set(pagosSeleccionados)
        if (nuevosSeleccionados.has(pagoId)) {
            nuevosSeleccionados.delete(pagoId)
        } else {
            nuevosSeleccionados.add(pagoId)
        }
        setPagosSeleccionados(nuevosSeleccionados)
    }

    const toggleSeleccionarTodos = () => {
        const todosSeleccionados = pagosSeleccionados.size === pagosFiltrados.length
        if (todosSeleccionados) {
            setPagosSeleccionados(new Set())
        } else {
            const todosIds = new Set(pagosFiltrados.map((pago) => pago.id))
            setPagosSeleccionados(todosIds)
        }
    }

    const verComprobante = (pago) => {
        if (pago.fotoComprobante) {
            setComprobanteSeleccionado(pago.fotoComprobante)
            setModalComprobanteVisible(true)
        } else {
            showError("Sin comprobante", "Este pago no tiene una foto del comprobante asociada.", [
                { text: "OK", style: "default" }
            ])
        }
    }

    const eliminarPago = async (pagoId) => {
        showInfo("Eliminar Pago", "¿Está seguro de que desea eliminar este pago pendiente?", [
            {
                text: "Cancelar",
                style: "cancel"
            },
            {
                text: "Eliminar",
                style: "destructive",
                onPress: async () => {
                    try {
                        await pagosPendientes.eliminar(pagoId)
                        showSuccess("Eliminado", "El pago ha sido eliminado exitosamente", [
                            { text: "OK", style: "default" }
                        ])
                        cargarPagos()
                    } catch (error) {
                        console.error("Error al eliminar pago:", error)
                        showError("Error", "No se pudo eliminar el pago. Inténtelo de nuevo.", [
                            { text: "OK", style: "default" }
                        ])
                    }
                }
            }
        ])
    }

    const entregarPagos = () => {
        const pagosAEntregar = pagosFiltrados.filter((pago) => pagosSeleccionados.has(pago.id))
        const montoTotal = pagosAEntregar.reduce((total, pago) => total + pago.monto, 0)

        if (pagosAEntregar.length === 0) {
            showError("Sin selección", "Debe seleccionar al menos un pago para entregar", [
                { text: "OK", style: "default" }
            ])
            return
        }

        showInfo(
            "Confirmar Entrega",
            `¿Confirma la entrega de ${pagosAEntregar.length} pago(s) por un total de ${numeral(
                montoTotal
            ).format("$0,0.00")}?`,
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Confirmar",
                    style: "default",
                    onPress: async () => {
                        setLoading(true)

                        try {
                            const resultado = await registroPagos.registrarPagosLote(pagosAEntregar)

                            if (resultado.success) {
                                for (const pagoExitoso of resultado.resultados.exitosos) {
                                    await pagosPendientes.eliminar(pagoExitoso.pagoId)
                                }

                                showSuccess(
                                    "¡Entrega Exitosa!",
                                    `${resultado.resultados.exitosos.length} pago(s) registrado(s) exitosamente en el servidor`,
                                    [
                                        {
                                            text: "OK",
                                            style: "default",
                                            onPress: () => {
                                                router.back()
                                            }
                                        }
                                    ]
                                )
                            } else {
                                const exitosos = resultado.resultados.exitosos.length
                                const fallidos = resultado.resultados.fallidos.length
                                for (const pagoExitoso of resultado.resultados.exitosos) {
                                    await pagosPendientes.eliminar(pagoExitoso.pagoId)
                                }
                                const mensaje =
                                    exitosos > 0
                                        ? `${exitosos} pago(s) registrado(s) exitosamente.\n${fallidos} pago(s) fallaron y permanecen pendientes.`
                                        : `No se pudo registrar ningún pago. Todos permanecen pendientes.`

                                showInfo("Entrega Parcial", mensaje, [
                                    // {
                                    //     text: "Ver Detalles",
                                    //     style: "default",
                                    //     onPress: () => {
                                    //         const errores = resultado.resultados.fallidos
                                    //             .map((f) => `Crédito ${f.credito}: ${f.error}`)
                                    //             .join("\n")

                                    //         showError("Detalles de Errores", errores, [
                                    //             { text: "OK", style: "default" }
                                    //         ])
                                    //     }
                                    // },
                                    {
                                        text: "Continuar",
                                        style: "default",
                                        onPress: cargarPagos
                                    }
                                ])
                            }
                        } catch (error) {
                            console.error("Error inesperado al entregar pagos:", error)
                            showError(
                                "Error Inesperado",
                                "Ocurrió un error inesperado al procesar los pagos. Inténtelo de nuevo.",
                                [{ text: "OK", style: "default" }]
                            )
                        } finally {
                            setLoading(false)
                        }
                    }
                }
            ]
        )
    }

    const calcularResumen = () => {
        const seleccionados = pagosFiltrados.filter((pago) => pagosSeleccionados.has(pago.id))
        const noSeleccionados = pagosFiltrados.filter((pago) => !pagosSeleccionados.has(pago.id))
        const montoSeleccionados = seleccionados.reduce((total, pago) => total + pago.monto, 0)
        const montoNoSeleccionados = noSeleccionados.reduce((total, pago) => total + pago.monto, 0)

        return {
            seleccionados: {
                cantidad: seleccionados.length,
                monto: montoSeleccionados
            },
            noSeleccionados: {
                cantidad: noSeleccionados.length,
                monto: montoNoSeleccionados
            }
        }
    }

    const resumen = calcularResumen()
    const todosSeleccionados =
        pagosSeleccionados.size === pagosFiltrados.length && pagosFiltrados.length > 0

    const renderPagoItem = ({ item }) => (
        <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-3 shadow-sm">
            <View className="flex-row items-center">
                <Pressable
                    onPress={() => toggleSeleccionPago(item.id)}
                    className={`w-6 h-6 rounded border-2 mr-4 items-center justify-center ${
                        pagosSeleccionados.has(item.id)
                            ? "bg-blue-500 border-blue-500"
                            : "border-gray-300"
                    }`}
                >
                    {pagosSeleccionados.has(item.id) && (
                        <MaterialIcons name="check" size={16} color="white" />
                    )}
                </Pressable>

                <View className="flex-1">
                    <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-1">
                            <Text className="text-base font-semibold text-gray-800">
                                Crédito {item.credito} • Ciclo {item.ciclo}
                            </Text>
                            <Text className="text-sm text-gray-600">{item.nombreCliente}</Text>
                            <Text className="text-xs text-gray-500">
                                {new Date(item.fechaCaptura).toLocaleString("es-MX", {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit"
                                })}
                            </Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-lg font-bold text-green-600">
                                {numeral(item.monto).format("$0,0.00")}
                            </Text>
                            <Pressable
                                onPress={() => verComprobante(item)}
                                className="bg-blue-500 px-3 py-2 rounded-lg"
                            >
                                <View className="flex-row items-center">
                                    <MaterialIcons name="visibility" size={16} color="white" />
                                    <Text className="text-white text-xs ml-1">Comprobante</Text>
                                </View>
                            </Pressable>
                            {/* <Pressable
                                onPress={() => eliminarPago(item.id)}
                                className="bg-red-500 px-3 py-2 rounded-lg"
                            >
                                <View className="flex-row items-center">
                                    <MaterialIcons name="delete" size={16} color="white" />
                                    <Text className="text-white text-xs ml-1">Eliminar</Text>
                                </View>
                            </Pressable> */}
                        </View>
                    </View>

                    <View className="flex-row justify-start">
                        <View className="bg-yellow-100 px-2 py-1 rounded-md">
                            <Text className="text-xs font-medium text-yellow-700">
                                {item.tipoEtiqueta || item.tipoPago}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    )

    return (
        <View
            className="flex-1 bg-primary"
            style={{
                paddingTop: insets.top
            }}
        >
            <View className="flex-row items-center p-4">
                <Pressable onPress={() => router.back()} className="mr-4">
                    <Feather name="arrow-left" size={24} color="white" />
                </Pressable>
                <Text className="flex-1 text-white text-lg font-semibold">Sincronizar Pagos</Text>
                <View className="flex-row items-center">
                    <Pressable
                        onPress={() => setMostrarBusqueda(!mostrarBusqueda)}
                        className="mr-3 p-2"
                    >
                        <MaterialIcons
                            name="search"
                            size={24}
                            color={mostrarBusqueda ? "#fbbf24" : "white"}
                        />
                    </Pressable>
                    <Pressable onPress={toggleSeleccionarTodos} className="p-2">
                        <MaterialIcons
                            name={todosSeleccionados ? "deselect" : "select-all"}
                            size={24}
                            color="white"
                        />
                    </Pressable>
                </View>
            </View>
            <View className="bg-white flex-1 rounded-t-3xl">
                {mostrarBusqueda && (
                    <View className="px-4 py-3 border-b border-gray-100">
                        <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3">
                            <MaterialIcons name="search" size={20} color="#6B7280" />
                            <TextInput
                                value={terminoBusqueda}
                                onChangeText={setTerminoBusqueda}
                                placeholder="Buscar por nombre o número de crédito..."
                                className="flex-1 ml-2 text-base"
                                autoFocus={true}
                            />
                            {terminoBusqueda.length > 0 && (
                                <Pressable onPress={() => setTerminoBusqueda("")}>
                                    <MaterialIcons name="clear" size={20} color="#6B7280" />
                                </Pressable>
                            )}
                        </View>
                        {terminoBusqueda.length > 0 && terminoBusqueda.length < 3 && (
                            <Text className="text-xs text-gray-500 mt-2">
                                Ingrese al menos 3 caracteres para buscar
                            </Text>
                        )}
                        {terminoBusqueda.length >= 3 && (
                            <Text className="text-xs text-gray-600 mt-2">
                                {pagosFiltrados.length} resultado(s) encontrado(s)
                            </Text>
                        )}
                    </View>
                )}
                <View className="flex-1 px-4 py-4" style={{ paddingBottom: 120 }}>
                    {loading ? (
                        <View className="flex-1 justify-center items-center">
                            <Text className="text-gray-500">Cargando pagos...</Text>
                        </View>
                    ) : pagosFiltrados.length === 0 ? (
                        <View className="flex-1 justify-center items-center">
                            <Text className="text-gray-500">
                                {terminoBusqueda.length >= 3
                                    ? "No se encontraron pagos para la búsqueda"
                                    : "No hay pagos pendientes"}
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={pagosFiltrados}
                            renderItem={renderPagoItem}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
                <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
                    <View className="mb-3">
                        <View className="flex-row justify-between items-center mb-1">
                            <Text className="text-sm font-medium text-green-700">
                                Seleccionados: {resumen.seleccionados.cantidad}
                            </Text>
                            <Text className="text-sm font-semibold text-green-700">
                                {numeral(resumen.seleccionados.monto).format("$0,0.00")}
                            </Text>
                        </View>
                        {resumen.noSeleccionados.cantidad > 0 && (
                            <View className="flex-row justify-between items-center">
                                <Text className="text-sm font-medium text-gray-500">
                                    No seleccionados: {resumen.noSeleccionados.cantidad}
                                </Text>
                                <Text className="text-sm font-semibold text-gray-500">
                                    {numeral(resumen.noSeleccionados.monto).format("$0,0.00")}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Pressable
                        onPress={entregarPagos}
                        className="bg-green-500 rounded-2xl p-4"
                        disabled={pagosSeleccionados.size === 0 || loading}
                        style={{
                            opacity: pagosSeleccionados.size === 0 || loading ? 0.5 : 1
                        }}
                    >
                        <View className="flex-row items-center justify-center">
                            {loading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <MaterialIcons name="sync" size={20} color="white" />
                            )}
                            <Text className="text-white font-semibold ml-2">
                                {loading ? "Procesando..." : "Sincronizar Pagos"}
                            </Text>
                        </View>
                    </Pressable>
                </View>
            </View>
            <Modal
                visible={modalComprobanteVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalComprobanteVisible(false)}
            >
                <View className="flex-1 bg-black bg-opacity-80 justify-center items-center">
                    <View className="bg-white rounded-2xl p-4 m-4 max-w-sm w-full">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-semibold text-gray-800">
                                Comprobante de Pago
                            </Text>
                            <Pressable
                                onPress={() => setModalComprobanteVisible(false)}
                                className="p-2"
                            >
                                <MaterialIcons name="close" size={24} color="#6B7280" />
                            </Pressable>
                        </View>
                        {comprobanteSeleccionado ? (
                            <View>
                                <Image
                                    source={{ uri: comprobanteSeleccionado }}
                                    className="h-96 rounded-xl"
                                    resizeMode="contain"
                                />
                            </View>
                        ) : (
                            <View className="items-center py-8">
                                <MaterialIcons
                                    name="image-not-supported"
                                    size={64}
                                    color="#9CA3AF"
                                />
                                <Text className="text-gray-500 mt-4">
                                    No se pudo cargar el comprobante
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
            <CustomAlert ref={alertRef} />
        </View>
    )
}

import { useState, useContext, useEffect } from "react"
import { SafeAreaInsetsContext } from "react-native-safe-area-context"
import { MaterialIcons } from "@expo/vector-icons"
import {
    View,
    Text,
    StatusBar,
    Image,
    FlatList,
    ActivityIndicator,
    Pressable,
    Platform,
    TextInput
} from "react-native"

import { COLORS, images } from "../../constants"
import { useSession } from "../../context/SessionContext"
import { useCartera } from "../../context/CarteraContext"
import TarjetaCarteraCredito from "../../components/TarjetaCarteraCredito"

export default function Cartera() {
    const { usuario } = useSession()
    const { clientes, loading, obtenerCartera } = useCartera()
    const insets = useContext(SafeAreaInsetsContext)
    const [expandedId, setExpandedId] = useState(null)
    const [gruposExpandidos, setGruposExpandidos] = useState({})
    const [mostrarBusqueda, setMostrarBusqueda] = useState(false)
    const [terminoBusqueda, setTerminoBusqueda] = useState("")
    const [clientesFiltrados, setClientesFiltrados] = useState([])
    const [gruposPorDia, setGruposPorDia] = useState([])

    useEffect(() => {
        const agruparPorDia = () => {
            const clientesConMora = clientesFiltrados.filter(
                (cliente) =>
                    cliente.mora_total &&
                    parseFloat(cliente.mora_total) > 0 &&
                    cliente.tipo_cartera !== "VIGENTE"
            )
            const clientesSinMora = clientesFiltrados.filter(
                (cliente) =>
                    cliente.tipo_cartera === "VIGENTE" ||
                    !cliente.mora_total ||
                    parseFloat(cliente.mora_total) === 0
            )

            const grupos = {}
            clientesSinMora.forEach((cliente) => {
                const dia = cliente.dia_pago || "Sin día asignado"
                if (!grupos[dia]) grupos[dia] = []
                grupos[dia].push(cliente)
            })

            const gruposArray = Object.entries(grupos)
                .map(([dia, clientes]) => ({
                    dia,
                    clientes: clientes.sort((a, b) => {
                        const nombreA = (a.nombre || "").toLowerCase()
                        const nombreB = (b.nombre || "").toLowerCase()
                        return nombreA.localeCompare(nombreB)
                    }),
                    cantidad: clientes.length
                }))
                .sort((a, b) => {
                    const normalizarDia = (dia) =>
                        dia
                            .toLowerCase()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")

                    const diasOrden = {
                        lunes: 1,
                        martes: 2,
                        miercoles: 3,
                        jueves: 4,
                        viernes: 5,
                        sabado: 6,
                        domingo: 7
                    }

                    const diaNormA = normalizarDia(a.dia)
                    const diaNormB = normalizarDia(b.dia)

                    return (diasOrden[diaNormA] || 999) - (diasOrden[diaNormB] || 999)
                })

            if (clientesConMora.length > 0) {
                gruposArray.push({
                    dia: "Morosos sin vencimiento",
                    clientes: clientesConMora.sort((a, b) => {
                        const nombreA = (a.nombre || "").toLowerCase()
                        const nombreB = (b.nombre || "").toLowerCase()
                        return nombreA.localeCompare(nombreB)
                    }),
                    cantidad: clientesConMora.length,
                    esMorosos: true
                })
            }

            setGruposPorDia(gruposArray)
        }

        agruparPorDia()
    }, [clientesFiltrados])

    useEffect(() => {
        if (terminoBusqueda.length >= 3) {
            const filtrados = clientes.filter((cliente) => {
                const nombreMatch = cliente.nombre
                    ?.toLowerCase()
                    .includes(terminoBusqueda.toLowerCase())
                const creditoMatch = cliente.cdgns?.includes(terminoBusqueda)
                return nombreMatch || creditoMatch
            })
            setClientesFiltrados(filtrados)
        } else {
            setClientesFiltrados(clientes)
        }
    }, [terminoBusqueda, clientes])

    useEffect(() => {
        setClientesFiltrados(clientes)
    }, [clientes])

    const actualizarClientes = async () => {
        await obtenerCartera(true)
    }

    const handleToggleExpansion = (clienteId) => {
        setExpandedId(expandedId === clienteId ? null : clienteId)
    }

    const toggleGrupo = (dia) => {
        setGruposExpandidos((prev) => ({
            ...prev,
            [dia]: !prev[dia]
        }))
    }

    const TarjetaGrupoDia = ({ grupo }) => {
        const isExpanded = gruposExpandidos[grupo.dia]
        const { dia, clientes, cantidad, esMorosos } = grupo

        return (
            <View className="mb-4">
                {/* Header de grupo */}
                <Pressable
                    onPress={() => toggleGrupo(dia)}
                    className={`rounded-2xl p-4 shadow-sm ${
                        esMorosos
                            ? "bg-red-50 border-2 border-red-200"
                            : "bg-blue-50 border-2 border-blue-200"
                    }`}
                >
                    <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                            <Text
                                className={`text-lg font-bold ${
                                    esMorosos ? "text-red-800" : "text-blue-800"
                                }`}
                            >
                                {dia}
                            </Text>
                            <Text
                                className={`text-sm mt-1 ${
                                    esMorosos ? "text-red-600" : "text-blue-600"
                                }`}
                            >
                                {cantidad} crédito{cantidad !== 1 ? "s" : ""}
                            </Text>
                        </View>
                        <View className="flex-row items-center">
                            {esMorosos && (
                                <View className="bg-red-500 px-2 py-1 rounded-full mr-3">
                                    <Text className="text-white text-xs font-bold">MORA</Text>
                                </View>
                            )}
                            <MaterialIcons
                                name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                                size={28}
                                color={esMorosos ? "#991b1b" : "#1e40af"}
                            />
                        </View>
                    </View>
                </Pressable>

                {/* Contenido expandido - Lista de créditos */}
                {isExpanded && (
                    <View className="mt-2">
                        {clientes.map((cliente) => (
                            <TarjetaCarteraCredito
                                key={cliente.cdgns}
                                cliente={cliente}
                                isExpanded={expandedId === cliente.cdgns}
                                onToggle={() => handleToggleExpansion(cliente.cdgns)}
                            />
                        ))}
                    </View>
                )}
            </View>
        )
    }

    return (
        <View
            className="flex-1 bg-primary"
            style={{
                paddingTop: insets.top,
                paddingBottom: Platform.OS === "ios" ? 90 : 60
            }}
        >
            <StatusBar barStyle="light-content" />
            <View className="flex-row items-center p-4">
                <Image
                    source={images.avatar}
                    className="w-10 h-10 rounded-full border border-white"
                />
                <Text className="flex-1 ml-2.5 text-white">HOLA, {usuario?.nombre}</Text>
            </View>

            <View className="bg-white flex-1 rounded-t-3xl">
                <View className="flex-row justify-between items-center border-b border-gray-200 px-3">
                    <Text className="text-lg font-semibold my-5">Mi cartera</Text>

                    <View className="flex-row items-center">
                        <Pressable
                            onPress={() => setMostrarBusqueda(!mostrarBusqueda)}
                            className="mr-3 p-2"
                        >
                            <MaterialIcons
                                name="search"
                                size={24}
                                color={mostrarBusqueda ? COLORS.primary : "black"}
                            />
                        </Pressable>

                        <Pressable onPress={actualizarClientes} disabled={loading}>
                            {loading ? (
                                <ActivityIndicator color="black" size="small" />
                            ) : (
                                <MaterialIcons name="refresh" size={24} color="black" />
                            )}
                        </Pressable>
                    </View>
                </View>

                {/* Campo de búsqueda */}
                {mostrarBusqueda && (
                    <View className="px-3 py-3 border-b border-gray-100">
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
                                {clientesFiltrados.length} resultado(s) encontrado(s)
                            </Text>
                        )}
                    </View>
                )}

                <View className="flex-1 px-5">
                    {gruposPorDia.length === 0 && !loading ? (
                        <View className="flex-1 justify-center items-center">
                            <Text className="text-gray-500">
                                {terminoBusqueda.length >= 3
                                    ? "No se encontraron resultados para la búsqueda"
                                    : "No tiene clientes asignados"}
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={gruposPorDia}
                            keyExtractor={(grupo) => grupo.dia}
                            renderItem={({ item }) => <TarjetaGrupoDia grupo={item} />}
                            showsVerticalScrollIndicator={false}
                            className="pt-2"
                        />
                    )}
                </View>
            </View>
        </View>
    )
}

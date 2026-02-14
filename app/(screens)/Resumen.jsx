import { useContext, useState, useEffect, useRef } from "react"
import { View, Text, TextInput, Pressable, ScrollView, FlatList } from "react-native"
import { Feather, MaterialIcons } from "@expo/vector-icons"
import { router } from "expo-router"
import { SafeAreaInsetsContext } from "react-native-safe-area-context"
import { useCustomAlert } from "../../hooks/useCustomAlert"
import { useCartera } from "../../context/CarteraContext"
import { resumenDiario, pagosPendientes, catalogos } from "../../services"
import CustomAlert from "../../components/CustomAlert"
import DateSelector from "../../components/DateSelector"
import MapModal from "../../components/MapModal"
import TarjetaResumenOperacion from "../../components/TarjetaResumenOperacion"
import storage from "../../utils/storage"
import numeral from "numeral"
import { dateShortBack, dateShortFront, dateTimeFront } from "../../utils/date"

export default function Resumen() {
    const insets = useContext(SafeAreaInsetsContext)
    const { alertRef, showError, showWait, hideWait, showInfo } = useCustomAlert()
    const { obtenerDetalleOperaciones, obtenerResumenDiario, lastUpdate } = useCartera()
    const [expandedId, setExpandedId] = useState(null)

    // Estados para el usuario
    const [usuario, setUsuario] = useState(null)

    // Estados para las fechas
    const [fechaInicio, setFechaInicio] = useState(null)
    const [fechaFin, setFechaFin] = useState(null)
    const [minDate, setMinDate] = useState(null)
    const [maxDate, setMaxDate] = useState(new Date())

    // Estados para los datos
    const [resumenData, setResumenData] = useState(null)
    const [operaciones, setOperaciones] = useState([])
    const [operacionesFiltradas, setOperacionesFiltradas] = useState([])

    // Estados para la interfaz
    const [busqueda, setBusqueda] = useState("")
    const [ordenamiento, setOrdenamiento] = useState("fecha")
    const [ordenAscendente, setOrdenAscendente] = useState(false)
    const [mostrarTodos, setMostrarTodos] = useState(false)

    // Estados para controles expandibles
    const [mostrarBusqueda, setMostrarBusqueda] = useState(false)
    const [mostrarFiltros, setMostrarFiltros] = useState(false)

    // Estados para el modal del mapa
    const [mapModalVisible, setMapModalVisible] = useState(false)
    const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState(null)

    const scrollViewRef = useRef(null)

    useEffect(() => {
        inicializarDatos()
    }, [])

    useEffect(() => {
        if (fechaInicio && fechaFin) {
            if (fechaInicio > fechaFin) {
                showError("Error de Fechas", "La fecha de inicio debe ser menor a la fecha fin")
                return
            }
            buscarResumen()
        }
    }, [fechaInicio, fechaFin])

    useEffect(() => {
        filtrarYOrdenarOperaciones()
    }, [operaciones, busqueda, ordenamiento, ordenAscendente])

    const inicializarDatos = async () => {
        try {
            // Obtener datos del usuario
            const userData = await storage.getUser()
            setUsuario(userData)

            // Configurar fechas por defecto
            const hoy = new Date()
            const ayer = new Date(hoy)
            ayer.setDate(hoy.getDate() - 1)

            // Fecha mínima: primer día del sexto mes atrás
            const fechaMinima = new Date(hoy)
            fechaMinima.setMonth(hoy.getMonth() - 6)
            fechaMinima.setDate(1)

            setFechaInicio(ayer)
            setFechaFin(hoy)
            setMinDate(fechaMinima)
            setMaxDate(hoy)
        } catch (error) {
            console.error("Error al inicializar datos:", error)
            showError("Error", "No se pudieron cargar los datos del usuario")
        }
    }

    const buscarResumen = async () => {
        if (!fechaInicio || !fechaFin) return

        try {
            showWait("Cargando Resumen", "Obteniendo los datos de pagos registrados...")

            const resultado = await resumenDiario.obtenerResumen(
                dateShortBack(fechaInicio),
                dateShortBack(fechaFin)
            )

            if (resultado.success) {
                setResumenData(resultado.data.resumen_diario)
                setOperaciones(resultado.data.detalle_operaciones || [])
                setMostrarTodos(false)
                setMostrarBusqueda(false)
            } else {
                await usarDatosFallback()
            }
        } catch (error) {
            await usarDatosFallback()
        } finally {
            hideWait()
        }
    }

    // Usar datos del contexto y pagos pendientes locales como fallback
    const usarDatosFallback = async () => {
        try {
            const resumenCache = obtenerResumenDiario()
            const operacionesCache = obtenerDetalleOperaciones() || []
            const pagosPendientesLocal = await pagosPendientes.obtenerTodos()
            const tipos = await catalogos.getTiposPagoLocal()
            let montoLocal = 0

            pagosPendientesLocal.forEach((pago) => {
                montoLocal += parseFloat(pago.monto)
                operacionesCache.unshift({
                    cdgns: pago.credito,
                    ciclo: pago.ciclo,
                    comentarios_ejecutivo: pago.comentarios,
                    fecha: dateShortFront(pago.fechaCaptura),
                    fregistro: dateTimeFront(pago.fechaCaptura),
                    latitud: pago.latitud,
                    longitud: pago.longitud,
                    monto: pago.monto,
                    nombre: pago.nombreCliente,
                    secuencia: 0,
                    tipo:
                        tipos.find((t) => t.codigo === pago.tipoPago)?.descripcion || "Desconocido",
                    _esPendiente: true
                })
            })

            resumenCache.total_operaciones += pagosPendientesLocal.length
            resumenCache.monto_total = parseFloat(resumenCache.monto_total) + montoLocal

            setResumenData(resumenCache)
            setOperaciones(operacionesCache)
            setMostrarTodos(false)
            setMostrarBusqueda(false)

            if (operacionesCache.length > 0 || pagosPendientesLocal.length > 0) {
                showInfo(
                    "Datos Locales",
                    `No se pudo conectar al servidor, mostrando datos locales.`,
                    [{ text: "OK", style: "default" }]
                )
            } else {
                showError("Sin Datos", "No hay información disponible para mostrar", [
                    { text: "OK", style: "default" }
                ])
                setResumenData(null)
                setOperaciones([])
            }
        } catch (error) {
            hideWait()
            console.error("Error al cargar datos de fallback:", error)
            showError("Error", "No se pudieron cargar los datos locales", [
                { text: "OK", style: "default" }
            ])
        }
    }

    const filtrarYOrdenarOperaciones = () => {
        let filtradas = [...operaciones]

        // Filtrar por búsqueda
        if (busqueda.trim()) {
            const termino = busqueda.toLowerCase().trim()
            filtradas = filtradas.filter(
                (op) =>
                    op.nombre.toLowerCase().includes(termino) ||
                    op.cdgns.toLowerCase().includes(termino)
            )
        }

        // Ordenar
        filtradas.sort((a, b) => {
            let resultado = 0
            switch (ordenamiento) {
                case "nombre":
                    resultado = a.nombre.localeCompare(b.nombre)
                    break
                case "credito":
                    resultado = a.cdgns.localeCompare(b.cdgns)
                    break
                case "fecha":
                default:
                    resultado = new Date(b.fregistro) - new Date(a.fregistro)
                    break
            }
            // Invertir el resultado si es orden ascendente
            return ordenAscendente ? -resultado : resultado
        })

        setOperacionesFiltradas(filtradas)
    }

    const mostrarUbicacion = (operacion) => {
        setUbicacionSeleccionada({
            latitud: operacion.latitud,
            longitud: operacion.longitud,
            nombreCliente: operacion.nombre,
            credito: operacion.cdgns
        })
        setMapModalVisible(true)
    }

    const scrollToTop = () => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: 0, animated: true })
        }
    }

    const handleToggleExpansion = (operacion) => {
        setExpandedId(expandedId === operacion ? null : operacion)
    }

    const operacionesParaMostrar = mostrarTodos
        ? operacionesFiltradas
        : operacionesFiltradas.slice(0, 10)

    return (
        <View
            className="flex-1 bg-primary"
            style={{
                paddingTop: insets.top
            }}
        >
            {/* Header */}
            <View className="flex-row items-center p-4">
                <Pressable onPress={() => router.back()} className="mr-4">
                    <Feather name="arrow-left" size={24} color="white" />
                </Pressable>
                <Text className="flex-1 text-white text-lg font-semibold">
                    Mis pagos registrados
                </Text>
                <Pressable onPress={() => setMostrarBusqueda(!mostrarBusqueda)} className="p-2">
                    <MaterialIcons name="search" size={24} color="white" />
                </Pressable>
            </View>

            <View className="bg-white flex-1 rounded-t-3xl">
                {/* Panel de búsqueda expandible */}
                {mostrarBusqueda && (
                    <View className="mx-4 mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-bold text-blue-800">Rango de Fechas</Text>
                            <Pressable
                                onPress={() => setMostrarBusqueda(false)}
                                className="w-6 h-6 rounded-full bg-blue-200 justify-center items-center"
                            >
                                <Feather name="x" size={14} color="#1E40AF" />
                            </Pressable>
                        </View>

                        <View className="flex-row gap-2 mb-4">
                            <View className="flex-1">
                                <DateSelector
                                    label="Inicio"
                                    date={fechaInicio}
                                    onDateChange={(date) => {
                                        setFechaInicio(date)
                                        if (fechaFin && date > fechaFin) {
                                            setFechaFin(date)
                                        }
                                    }}
                                    minDate={minDate}
                                    maxDate={fechaFin || maxDate}
                                />
                            </View>
                            <View className="flex-1">
                                <DateSelector
                                    label="Fin"
                                    date={fechaFin}
                                    onDateChange={(date) => {
                                        setFechaFin(date)
                                        if (fechaInicio && date < fechaInicio) {
                                            setFechaInicio(date)
                                        }
                                    }}
                                    minDate={fechaInicio || minDate}
                                    maxDate={maxDate}
                                />
                            </View>
                        </View>

                        <Pressable
                            onPress={buscarResumen}
                            className="bg-blue-600 rounded-xl p-4 flex-row justify-center items-center"
                        >
                            <MaterialIcons name="search" size={24} color="white" />
                            <Text className="text-white font-semibold text-base ml-2">
                                Consultar
                            </Text>
                        </Pressable>
                    </View>
                )}

                {/* Resumen del Período - Fijo en la parte superior */}
                {resumenData && (
                    <View className="bg-white mx-4 mt-4 p-6 rounded-xl shadow-sm border border-gray-200">
                        <Text className="text-lg font-bold text-gray-800 mb-4">
                            Resumen del Período
                        </Text>

                        <View className="space-y-3">
                            <View className="flex-row justify-between items-center">
                                <Text className="text-gray-600">Rango de fechas:</Text>
                                <Text className="font-semibold text-gray-800">
                                    {resumenData.rango_fechas}
                                </Text>
                            </View>

                            <View className="flex-row justify-between items-center">
                                <Text className="text-gray-600">Total operaciones:</Text>
                                <Text className="font-semibold text-blue-600 text-lg">
                                    {resumenData.total_operaciones}
                                </Text>
                            </View>

                            <View className="flex-row justify-between items-center border-t border-gray-200 pt-3">
                                <Text className="text-gray-600 font-medium">Monto total:</Text>
                                <Text className="font-bold text-green-600 text-xl">
                                    ${numeral(resumenData.monto_total).format("0,0.00")}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Título de operaciones con icono de filtro */}
                {operaciones.length > 0 && (
                    <View className="flex-row justify-between items-center mx-4 mt-6 mb-4">
                        <Text className="text-lg font-bold text-gray-800">
                            Detalle de Operaciones ({operacionesFiltradas.length})
                        </Text>
                        <Pressable onPress={() => setMostrarFiltros(!mostrarFiltros)}>
                            <MaterialIcons name="filter-list" size={20} color="black" />
                        </Pressable>
                    </View>
                )}

                {/* Panel de filtros expandible */}
                {mostrarFiltros && operaciones.length > 0 && (
                    <View className="mx-4 mb-4 p-4 bg-green-50 rounded-xl border border-green-200">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-bold text-green-800">
                                Filtros y Búsqueda
                            </Text>
                            <Pressable
                                onPress={() => setMostrarFiltros(false)}
                                className="w-6 h-6 rounded-full bg-green-200 justify-center items-center"
                            >
                                <Feather name="x" size={14} color="#16A34A" />
                            </Pressable>
                        </View>

                        {/* Campo de búsqueda */}
                        <View className="flex-row items-center bg-white rounded-xl px-4 py-3 mb-4 border border-green-200">
                            <Feather name="search" size={20} color="#9CA3AF" />
                            <TextInput
                                className="flex-1 ml-3 text-gray-800"
                                placeholder="Buscar por nombre o crédito..."
                                value={busqueda}
                                onChangeText={setBusqueda}
                                placeholderTextColor="#9CA3AF"
                            />
                            {busqueda.length > 0 && (
                                <Pressable onPress={() => setBusqueda("")}>
                                    <Feather name="x" size={16} color="#9CA3AF" />
                                </Pressable>
                            )}
                        </View>

                        {/* Opciones de ordenamiento */}
                        <View className="mb-4">
                            <Text className="text-green-700 font-medium mb-2">Ordenar por:</Text>
                            <View className="flex-row flex-wrap gap-2 mb-3">
                                {[
                                    { key: "fecha", label: "Fecha" },
                                    { key: "nombre", label: "Nombre" },
                                    { key: "credito", label: "Crédito" }
                                ].map((tipo) => (
                                    <Pressable
                                        key={tipo.key}
                                        onPress={() => setOrdenamiento(tipo.key)}
                                        className={`px-3 py-2 rounded-lg ${
                                            ordenamiento === tipo.key
                                                ? "bg-green-200 border border-green-400"
                                                : "bg-white border border-green-200"
                                        }`}
                                    >
                                        <Text
                                            className={`text-sm font-medium ${
                                                ordenamiento === tipo.key
                                                    ? "text-green-800"
                                                    : "text-green-600"
                                            }`}
                                        >
                                            {tipo.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            {/* Checkbox para orden ascendente */}
                            <Pressable
                                onPress={() => setOrdenAscendente(!ordenAscendente)}
                                className="flex-row items-center bg-white p-3 rounded-lg border border-green-200"
                            >
                                <View
                                    className={`w-5 h-5 rounded border-2 justify-center items-center mr-3 ${
                                        ordenAscendente
                                            ? "bg-green-600 border-green-600"
                                            : "border-green-400"
                                    }`}
                                >
                                    {ordenAscendente && (
                                        <Feather name="check" size={12} color="white" />
                                    )}
                                </View>
                                <Text className="text-green-700 font-medium">
                                    Orden descendente
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                )}

                {/* Área de scroll para operaciones */}
                <ScrollView ref={scrollViewRef} className="flex-1">
                    {/* Lista de Operaciones */}
                    {operacionesParaMostrar.length > 0 && (
                        <View className="mx-4 mt-4 mb-6">
                            <FlatList
                                data={operacionesParaMostrar}
                                keyExtractor={(operacion) =>
                                    operacion.cdgns && operacion.ciclo && operacion.secuencia
                                }
                                renderItem={({ item }) => (
                                    <TarjetaResumenOperacion
                                        operacion={item}
                                        expandida={expandedId === item}
                                        onToggle={() => handleToggleExpansion(item)}
                                        onVerUbicacion={mostrarUbicacion}
                                    />
                                )}
                                scrollEnabled={false}
                                showsVerticalScrollIndicator={false}
                                className="pt-2"
                            />

                            {/* Botones de control */}
                            <View className="mt-4 space-y-3">
                                {operacionesFiltradas.length > 10 && !mostrarTodos && (
                                    <Pressable
                                        onPress={() => setMostrarTodos(true)}
                                        className="bg-blue-600 rounded-xl p-4 flex-row justify-center items-center"
                                    >
                                        <Feather name="chevron-down" size={20} color="white" />
                                        <Text className="text-white font-semibold text-base ml-2">
                                            Mostrar Todos ({operacionesFiltradas.length})
                                        </Text>
                                    </Pressable>
                                )}

                                {mostrarTodos && operacionesFiltradas.length > 10 && (
                                    <Pressable
                                        onPress={scrollToTop}
                                        className="bg-gray-600 rounded-xl p-4 flex-row justify-center items-center"
                                    >
                                        <Feather name="chevron-up" size={20} color="white" />
                                        <Text className="text-white font-semibold text-base ml-2">
                                            Volver al Inicio
                                        </Text>
                                    </Pressable>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Estado vacío */}
                    {operaciones.length === 0 && resumenData && (
                        <View className="mx-4 mt-8 p-8 bg-white rounded-xl shadow-sm items-center">
                            <Feather name="inbox" size={48} color="#9CA3AF" />
                            <Text className="text-lg font-medium text-gray-800 mt-4 mb-2">
                                Sin Operaciones
                            </Text>
                            <Text className="text-gray-600 text-center">
                                No se encontraron operaciones en el rango de fechas seleccionado
                            </Text>
                        </View>
                    )}

                    {/* Mensaje inicial */}
                    {!resumenData && (
                        <View className="mx-4 mt-8 p-8 bg-white rounded-xl shadow-sm items-center">
                            <Feather name="calendar" size={48} color="#9CA3AF" />
                            <Text className="text-lg font-medium text-gray-800 mt-4 mb-2">
                                Selecciona un Rango de Fechas
                            </Text>
                            <Text className="text-gray-600 text-center">
                                Toca el icono de búsqueda para seleccionar las fechas y consultar
                                tus pagos
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </View>

            {/* Modal del Mapa */}
            <MapModal
                visible={mapModalVisible}
                onClose={() => setMapModalVisible(false)}
                latitud={ubicacionSeleccionada?.latitud}
                longitud={ubicacionSeleccionada?.longitud}
                nombreCliente={ubicacionSeleccionada?.nombreCliente}
                credito={ubicacionSeleccionada?.credito}
            />

            <CustomAlert ref={alertRef} />
        </View>
    )
}

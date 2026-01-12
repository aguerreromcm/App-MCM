import { useContext, useState, useEffect } from "react"
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    Animated,
    Image,
    Platform
} from "react-native"
import { useLocalSearchParams, router } from "expo-router"
import { Feather, MaterialIcons } from "@expo/vector-icons"
import { SafeAreaInsetsContext } from "react-native-safe-area-context"
import numeral from "numeral"
import { useCustomAlert } from "../../hooks/useCustomAlert"
import { useCartera } from "../../context/CarteraContext"
import { usePago } from "../../context/PagoContext"
import { pagosPendientes, catalogos, registroPagos } from "../../services"
import CustomAlert from "../../components/CustomAlert"
import * as ImagePicker from "expo-image-picker"
import * as Location from "expo-location"
import { generarIdPago } from "../../utils/pagoId"
import storage from "../../utils/storage"

export default function Pago() {
    const params = useLocalSearchParams()
    const { datosPago, tieneContextoPago, limpiarDatosPago } = usePago()
    const insets = useContext(SafeAreaInsetsContext)
    const { alertRef, showError, showSuccess, showInfo, showWarning, showWait, hideWait } =
        useCustomAlert()
    const { validarCredito } = useCartera()

    // Estado para controlar si los parámetros son válidos (vienen con timestamp reciente)
    const [parametrosValidos, setParametrosValidos] = useState(false)

    // Estados para los campos del formulario
    const [credito, setCredito] = useState("")
    const [ciclo, setCiclo] = useState("")
    const [monto, setMonto] = useState("")
    const [tipoPago, setTipoPago] = useState("")
    const [fotoComprobante, setFotoComprobante] = useState(null)
    const [comentarios, setComentarios] = useState("")

    // Estados para validación de crédito
    const [creditoValido, setCreditoValido] = useState(null)
    const [infoCredito, setInfoCredito] = useState(null)

    // Estados para tipos de pago y la interfaz
    const [tiposPago, setTiposPago] = useState([])
    const [showTipoSelect, setShowTipoSelect] = useState(false)
    const [montoFormateado, setMontoFormateado] = useState("")
    const [focusedField, setFocusedField] = useState("")

    const scaleAnim = useState(new Animated.Value(1))[0]
    const shakeAnim = useState(new Animated.Value(0))[0]

    const esDetalleCredito = tieneContextoPago()

    // Efecto para cargar datos desde el contexto
    useEffect(() => {
        if (esDetalleCredito && datosPago) {
            setParametrosValidos(true)
            setCredito(datosPago.noCreditoDetalle)
            setCiclo(datosPago.cicloDetalle)
            setMonto(datosPago.pagoSemanalDetalle?.toString() || "")
            setTipoPago(datosPago.pagoSemanalDetalle ? "P" : "") // P es el código por defecto para PAGO
        } else {
            setParametrosValidos(false)
        }
    }, [esDetalleCredito, datosPago])

    // Efecto para validar el número de crédito cuando cambia
    useEffect(() => {
        if (credito.length === 6) {
            const resultado = validarCredito(credito)
            setCreditoValido(resultado.valido)

            if (resultado.valido) {
                setInfoCredito(resultado.cliente)
                // Auto-llenar el ciclo si el crédito es válido y no viene de DetalleCredito
                if (!esDetalleCredito && resultado.cliente.ciclo) {
                    setCiclo(resultado.cliente.ciclo.toString())
                }

                // Auto-llenar el monto con pago_semanal si no viene de DetalleCredito
                if (!esDetalleCredito && resultado.cliente.pago_semanal) {
                    setMonto(resultado.cliente.pago_semanal.toString())
                    setTipoPago("P") // Establecer como PAGO por defecto
                }
            } else {
                setInfoCredito(null)
                // Mostrar error si el crédito no es válido
                showError("Crédito no válido", resultado.mensaje, [
                    { text: "OK", style: "default" }
                ])
            }
        } else if (credito.length > 0) {
            setCreditoValido(null)
            setInfoCredito(null)
        }
    }, [credito, validarCredito, esDetalleCredito])

    // Cargar tipos de pago desde catálogos
    useEffect(() => {
        const cargarTiposPago = async () => {
            try {
                const tipos = await catalogos.getTiposPagoLocal()
                setTiposPago(tipos)
            } catch (error) {
                console.error("Error al cargar tipos de pago:", error)
                // Fallback a tipos por defecto
                setTiposPago([
                    { codigo: "P", descripcion: "PAGO" },
                    { codigo: "M", descripcion: "MULTA" }
                ])
            }
        }

        cargarTiposPago()
    }, [])

    useEffect(() => {
        if (monto) {
            const numero = parseFloat(monto.replace(/[^0-9.]/g, ""))
            if (!isNaN(numero)) {
                setMontoFormateado(numeral(numero).format("$0,0.00"))
            } else {
                setMontoFormateado("")
            }
        } else {
            setMontoFormateado("")
        }
    }, [monto])

    const animarError = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true })
        ]).start()
    }

    const limpiarFormulario = () => {
        // Siempre limpiar todos los campos
        setCredito("")
        setCiclo("")
        setMonto("")
        setTipoPago("")
        setComentarios("")
        setFotoComprobante(null)
        setMontoFormateado("")
        setFocusedField("")
        setParametrosValidos(false)
        setCreditoValido(null)
        setInfoCredito(null)

        // Limpiar contexto de pago
        limpiarDatosPago()
    }

    const validarDatos = () => {
        if (!credito.trim()) {
            showError("Error", "El número de crédito es requerido", [
                { text: "OK", style: "default" }
            ])
            animarError()
            return false
        }

        if (credito.length !== 6) {
            showError("Error", "El número de crédito debe tener 6 dígitos", [
                { text: "OK", style: "default" }
            ])
            animarError()
            return false
        }

        if (creditoValido !== true) {
            showError(
                "Error",
                "El número de crédito no es válido o no se encuentra en su cartera",
                [{ text: "OK", style: "default" }]
            )
            animarError()
            return false
        }

        if (!ciclo.trim()) {
            showError("Error", "El ciclo es requerido", [{ text: "OK", style: "default" }])
            animarError()
            return false
        }
        if (!tipoPago) {
            showError("Error", "Debe seleccionar un tipo de pago", [
                { text: "OK", style: "default" }
            ])
            animarError()
            return false
        }
        if (!monto.trim() || isNaN(parseFloat(monto)) || parseFloat(monto) <= 0) {
            showError("Error", "El monto debe ser un número válido mayor a 0", [
                { text: "OK", style: "default" }
            ])
            animarError()
            return false
        }

        if (!fotoComprobante) {
            showError("Error", "Debe capturar una foto del comprobante firmado", [
                { text: "OK", style: "default" }
            ])
            animarError()
            return false
        }

        // Validación de monto máximo basada en el pago semanal
        let pagoSemanalReferencia
        if (esDetalleCredito && datosPago?.pagoSemanalDetalle) {
            // Si viene del contexto de DetalleCredito, usar pagoSemanalDetalle
            pagoSemanalReferencia = datosPago.pagoSemanalDetalle
        } else if (infoCredito?.pago_semanal) {
            // Si es búsqueda directa, usar el pago_semanal del endpoint
            pagoSemanalReferencia = infoCredito.pago_semanal
        }

        if (pagoSemanalReferencia) {
            const montoMaximo = numeral(pagoSemanalReferencia).multiply(2)
            if (montoMaximo.value() > 0 && montoMaximo.value() < monto) {
                showError(
                    "Error",
                    `El monto no puede ser mayor al doble del pago semanal (${montoMaximo.format(
                        "$0,0.00"
                    )})`,
                    [{ text: "OK", style: "default" }]
                )
                animarError()
                return false
            }
        }

        return true
    }

    const procesarPago = async () => {
        if (!validarDatos()) return

        // Animación de feedback visual
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
        ]).start()

        const tipoSeleccionado = tiposPago.find((t) => t.codigo === tipoPago)

        // Determinar pago semanal de referencia para comparación
        let pagoSemanalReferencia
        if (esDetalleCredito && datosPago?.pagoSemanalDetalle) {
            pagoSemanalReferencia = datosPago.pagoSemanalDetalle
        } else if (infoCredito?.pago_semanal) {
            pagoSemanalReferencia = infoCredito.pago_semanal
        }

        const diferencia = pagoSemanalReferencia
            ? numeral(montoFormateado).subtract(numeral(pagoSemanalReferencia).value())
            : numeral(0)

        const alerta = diferencia.value() > 1 ? showWarning : showInfo
        const titulo =
            diferencia.value() > 1
                ? `El monto a registrar es mayor al pago semanal por ${diferencia.format(
                      "$0,0.00"
                  )}\n`
                : "Confirmar Registro"
        const confirmacionMensaje = `¿Confirma que desea registrar un ${tipoSeleccionado?.descripcion.toLowerCase()} de ${montoFormateado} para el crédito ${credito}?`
        // Prueba cambio repositorio
        // Mostrar confirmación antes de procesar
        alerta(titulo, confirmacionMensaje, [
            {
                text: "Cancelar",
                style: "cancel",
                onPress: () => {
                    // No hacer nada, solo cerrar el modal
                }
            },
            {
                text: "Confirmar",
                style: "default",
                onPress: async () => {
                    try {
                        // Mostrar modal de espera al inicio del proceso
                        showWait("Procesando Pago", "Registrando el pago, por favor espere...")

                        // Obtener ubicación antes de guardar el pago
                        const ubicacion = await obtenerUbicacion()
                        if (!ubicacion) {
                            // Si no se pudo obtener la ubicación, no continuar
                            hideWait()
                            return
                        }

                        // Obtener información del usuario actual
                        const usuario = await storage.getUser()
                        const usuarioId = usuario?.id_usuario || "UNKNOWN"

                        // Generar ID único para el pago
                        const fechaCaptura = new Date()
                        const idPago = await generarIdPago(credito, fechaCaptura, usuarioId, monto)

                        // Preparar los datos del pago
                        const pagoData = {
                            id: idPago,
                            credito,
                            ciclo,
                            monto,
                            comentarios,
                            tipoPago: tipoPago, // código del tipo
                            tipoEtiqueta: tipoSeleccionado?.descripcion || tipoPago, // etiqueta para mostrar
                            nombreCliente: infoCredito?.nombre || params.nombre || "",
                            fotoComprobante: fotoComprobante?.uri || null,
                            latitud: ubicacion.latitud,
                            longitud: ubicacion.longitud,
                            fechaCaptura: fechaCaptura,
                            fechaDiaPago: infoCredito?.fecha_dia_pago || params.fechaDiaPago || "",
                            usuarioId: usuarioId
                        }

                        // Intentar enviar directamente al servidor primero
                        try {
                            const resultadoServidor = await registroPagos.registrarPago(pagoData)

                            if (resultadoServidor.success) {
                                hideWait()
                                const mensaje = `${tipoSeleccionado?.descripcion} de ${montoFormateado} registrado exitosamente en el servidor`

                                showSuccess("¡Pago Registrado!", mensaje, [
                                    {
                                        text: "OK",
                                        style: "default",
                                        onPress: () => {
                                            limpiarFormulario()
                                            if (esDetalleCredito) {
                                                router.push("/(screens)/DetalleCredito")
                                            } else {
                                                router.replace("/(tabs)/Cartera")
                                            }
                                        }
                                    }
                                ])
                                return
                            }
                        } catch (error) {
                            console.log("Error al enviar al servidor, guardando localmente:", error)
                        }

                        // Si llegamos aquí, no se pudo enviar al servidor
                        // Guardar en storage local como pendiente
                        const resultado = await pagosPendientes.guardar(pagoData)

                        if (resultado.success) {
                            hideWait()
                            const mensaje = `${tipoSeleccionado?.descripcion} de ${montoFormateado} guardado localmente, debe realizar la sincronización manual después.`

                            showInfo("Pago Guardado Localmente", mensaje, [
                                {
                                    text: "OK",
                                    style: "default",
                                    onPress: () => {
                                        limpiarFormulario()
                                        if (esDetalleCredito) {
                                            router.push("/(screens)/DetalleCredito")
                                        } else {
                                            router.replace("/(tabs)/Cartera")
                                        }
                                    }
                                }
                            ])
                        } else {
                            hideWait()
                            showError("Error", "No se pudo guardar el pago. Inténtelo de nuevo.", [
                                { text: "OK", style: "default" }
                            ])
                        }
                    } catch (error) {
                        console.error("Error al procesar pago:", error)
                        hideWait()
                        showError("Error", "Ocurrió un error inesperado al procesar el pago.", [
                            { text: "OK", style: "default" }
                        ])
                    }
                }
            }
        ])
    }

    const formatearMonto = (valor) => {
        const numero = valor.replace(/[^0-9.]/g, "")
        return numero
    }

    const capturarFoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync()

            if (status !== "granted") {
                showError(
                    "Permisos Requeridos",
                    "Se necesitan permisos de cámara para capturar el comprobante",
                    [{ text: "OK", style: "default" }]
                )
                return
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ["images"]
            })

            if (!result.canceled) {
                setFotoComprobante(result.assets[0])
                showSuccess("¡Foto Capturada!", "El comprobante ha sido capturado correctamente", [
                    { text: "OK", style: "default" }
                ])
            }
        } catch (error) {
            console.error("Error al capturar foto:", error)
            showError("Error", "No se pudo capturar la foto. Inténtelo de nuevo.", [
                { text: "OK", style: "default" }
            ])
        }
    }

    const obtenerUbicacion = async () => {
        try {
            // Solicitar permisos de ubicación
            const { status } = await Location.requestForegroundPermissionsAsync()

            if (status !== "granted") {
                showError(
                    "Permisos Requeridos",
                    "Se necesitan permisos de ubicación para registrar el pago",
                    [{ text: "OK", style: "default" }]
                )
                return null
            }

            // Obtener ubicación actual
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
                timeout: 10000,
                maximumAge: 60000
            })

            return {
                latitud: location.coords.latitude,
                longitud: location.coords.longitude
            }
        } catch (error) {
            console.error("Error al obtener ubicación:", error)
            showError("Error", "No se pudo obtener la ubicación. Inténtelo de nuevo.", [
                { text: "OK", style: "default" }
            ])
            return null
        }
    }

    return (
        <View
            className="flex-1 bg-primary"
            style={{
                paddingTop: insets.top,
                paddingBottom: Platform.OS === "ios" ? 90 : 60
            }}
        >
            <View className="flex-row items-center p-4">
                <Text className="flex-1 text-white text-lg font-semibold">Registro de Pago</Text>
            </View>
            <View className="bg-white flex-1 rounded-t-3xl">
                <View className="px-6 py-5 border-b border-gray-200">
                    <View className="flex-row items-center">
                        <View className="bg-green-100 p-3 rounded-full mr-4">
                            <MaterialIcons name="payment" size={24} color="#16a34a" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-2xl font-bold text-gray-800">Nuevo Pago</Text>
                            <Text className="text-base text-gray-600">
                                {esDetalleCredito
                                    ? "Confirme los datos del pago"
                                    : "Complete la información del pago"}
                            </Text>
                        </View>
                    </View>
                </View>
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    <Animated.View
                        className="p-6"
                        style={{ transform: [{ translateX: shakeAnim }] }}
                    >
                        <View className="mb-6">
                            <View className="flex-row">
                                <View className="flex-1 mr-3">
                                    <Text className="text-sm font-medium text-gray-700 mb-2">
                                        Número de Crédito
                                    </Text>
                                    <View
                                        className={`border-2 rounded-2xl p-4 ${
                                            esDetalleCredito
                                                ? "bg-gray-50 border-gray-200"
                                                : creditoValido === true
                                                ? "border-green-400 bg-green-50"
                                                : creditoValido === false
                                                ? "border-red-400 bg-red-50"
                                                : focusedField === "credito"
                                                ? "border-blue-400 bg-blue-50"
                                                : "border-gray-300 bg-white"
                                        }`}
                                    >
                                        <View className="flex-row items-center">
                                            <TextInput
                                                value={credito}
                                                onChangeText={setCredito}
                                                placeholder="Ej: 123456"
                                                editable={!esDetalleCredito}
                                                onFocus={() => setFocusedField("credito")}
                                                onBlur={() => setFocusedField("")}
                                                className="flex-1 text-2xl font-bold text-gray-800"
                                                keyboardType="numeric"
                                                maxLength={6}
                                            />
                                            {credito.length === 6 && creditoValido !== null && (
                                                <MaterialIcons
                                                    name={creditoValido ? "check-circle" : "error"}
                                                    size={20}
                                                    color={creditoValido ? "#16a34a" : "#ef4444"}
                                                />
                                            )}
                                        </View>
                                    </View>
                                </View>
                                <View className="w-24">
                                    <Text className="text-sm font-medium text-gray-700 mb-2">
                                        Ciclo
                                    </Text>
                                    <View
                                        className={`border-2 rounded-2xl p-4 ${
                                            esDetalleCredito
                                                ? "bg-gray-50 border-gray-200"
                                                : focusedField === "ciclo"
                                                ? "border-blue-400 bg-blue-50"
                                                : "border-gray-300 bg-white"
                                        }`}
                                    >
                                        <TextInput
                                            value={ciclo}
                                            onChangeText={setCiclo}
                                            editable={false}
                                            className="flex-1 text-2xl font-bold text-gray-800"
                                            keyboardType="numeric"
                                            maxLength={2}
                                        />
                                    </View>
                                </View>
                            </View>
                            {creditoValido && infoCredito && (
                                <View className="mt-2 p-3 bg-green-50 rounded-xl border border-green-200">
                                    <Text className="text-sm font-medium text-green-800">
                                        ✓ {infoCredito.nombre}
                                    </Text>
                                    {infoCredito.pago_semanal && (
                                        <Text className="text-xs text-green-700 mt-1">
                                            Pago semanal: $
                                            {numeral(infoCredito.pago_semanal).format("0,0.00")}
                                        </Text>
                                    )}
                                </View>
                            )}
                        </View>
                        <View className="mb-6">
                            <Text className="text-sm font-medium text-gray-700 mb-2">
                                Tipo de Movimiento
                            </Text>
                            <Pressable
                                onPress={() => setShowTipoSelect(!showTipoSelect)}
                                className={`border-2 rounded-2xl p-4 flex-row justify-between items-center ${
                                    focusedField === "tipo"
                                        ? "border-blue-400 bg-blue-50"
                                        : "border-gray-300 bg-white"
                                }`}
                            >
                                <View className="flex-row items-center flex-1">
                                    {tipoPago ? (
                                        <>
                                            <MaterialIcons
                                                name="check"
                                                size={20}
                                                color="#16a34a"
                                                className="mr-2"
                                            />
                                            <Text className="text-base font-medium text-gray-800">
                                                {tiposPago.find((t) => t.codigo === tipoPago)
                                                    ?.descripcion || tipoPago}
                                            </Text>
                                        </>
                                    ) : (
                                        <Text className="text-base text-gray-400">
                                            Seleccione el tipo de movimiento
                                        </Text>
                                    )}
                                </View>
                                <MaterialIcons
                                    name={
                                        showTipoSelect ? "keyboard-arrow-up" : "keyboard-arrow-down"
                                    }
                                    size={24}
                                    color="#6B7280"
                                />
                            </Pressable>
                            {showTipoSelect && (
                                <View className="mt-2 border-2 border-gray-200 rounded-2xl bg-white shadow-sm">
                                    {tiposPago.map((tipo, index) => (
                                        <Pressable
                                            key={tipo.codigo}
                                            onPress={() => {
                                                setTipoPago(tipo.codigo)
                                                setShowTipoSelect(false)
                                                setFocusedField("")
                                            }}
                                            className={`p-4 flex-row items-center justify-between ${
                                                index < tiposPago.length - 1
                                                    ? "border-b border-gray-100"
                                                    : ""
                                            }`}
                                        >
                                            <Text className="text-base font-medium text-gray-800 flex-1">
                                                {tipo.descripcion}
                                            </Text>
                                            {tipoPago === tipo.codigo && (
                                                <MaterialIcons
                                                    name="check"
                                                    size={20}
                                                    color="#16a34a"
                                                />
                                            )}
                                        </Pressable>
                                    ))}
                                </View>
                            )}
                        </View>
                        <View className="mb-6 flex-row">
                            <View className="flex-1 mr-3">
                                <Text className="text-sm font-medium text-gray-700 mb-2">
                                    Monto del Pago
                                </Text>
                                <View
                                    className={`border-2 rounded-2xl p-6 ${
                                        focusedField === "monto"
                                            ? "border-green-400 bg-green-50"
                                            : "border-gray-300 bg-white"
                                    }`}
                                >
                                    <View className="flex-row items-center">
                                        <Text className="text-2xl font-bold text-gray-600 mr-2">
                                            $
                                        </Text>
                                        <TextInput
                                            value={monto}
                                            onChangeText={(text) => {
                                                const cleaned = formatearMonto(text)
                                                setMonto(cleaned)
                                            }}
                                            placeholder="0.00"
                                            onFocus={() => setFocusedField("monto")}
                                            onBlur={() => setFocusedField("")}
                                            className="flex-1 text-2xl font-bold text-gray-800"
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>
                            </View>
                            <View>
                                <Text className="text-sm font-medium text-gray-700 mb-2">
                                    Comprobante
                                </Text>
                                <Pressable
                                    onPress={capturarFoto}
                                    className={`flex-1 rounded-2xl w-24 justify-center items-center ${
                                        fotoComprobante ? "bg-green-500" : "bg-blue-500"
                                    }`}
                                >
                                    {fotoComprobante ? (
                                        <View className="items-center">
                                            <MaterialIcons
                                                name="check-circle"
                                                size={30}
                                                color="white"
                                            />
                                            <Text className="text-white text-xs mt-1 text-center">
                                                Capturado
                                            </Text>
                                        </View>
                                    ) : (
                                        <View className="items-center">
                                            <Feather name="camera" size={30} color="white" />
                                        </View>
                                    )}
                                </Pressable>
                            </View>
                        </View>
                        {/* Campo de texto para comentarios */}
                        <View className="mb-6">
                            <Text className="text-sm font-medium text-gray-700 mb-2">
                                Comentarios
                            </Text>
                            <TextInput
                                value={comentarios}
                                onChangeText={setComentarios}
                                className="border border-gray-300 rounded-lg p-2"
                                multiline
                                numberOfLines={5}
                                placeholder="Escribe tus comentarios aquí..."
                            />
                        </View>
                        {fotoComprobante && (
                            <View>
                                <Text className="text-sm font-medium text-gray-700 mb-2">
                                    Vista Previa de la Tarjeta de Pagos
                                </Text>
                                <View className="border-2 border-green-200 rounded-2xl p-4 bg-green-50">
                                    <Image
                                        source={{ uri: fotoComprobante.uri }}
                                        className="w-full h-48 rounded-xl"
                                        resizeMode="cover"
                                    />
                                    <View className="mt-3 flex-row items-center justify-between">
                                        <View className="flex-row items-center">
                                            <MaterialIcons
                                                name="verified"
                                                size={20}
                                                color="#16a34a"
                                            />
                                            <Text className="text-green-700 font-medium ml-2">
                                                Comprobante capturado
                                            </Text>
                                        </View>
                                        <Pressable
                                            onPress={capturarFoto}
                                            className="bg-blue-500 px-3 py-1 rounded-lg"
                                        >
                                            <Text className="text-white text-sm">Cambiar</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        )}
                    </Animated.View>
                </ScrollView>
                <View className="flex-row px-6 pt-2 border-t border-gray-200 justify-between">
                    {esDetalleCredito ? (
                        <View className="mb-4">
                            <Pressable
                                onPress={() => {
                                    limpiarFormulario()
                                    router.push("/(screens)/DetalleCredito")
                                }}
                                className="bg-red-600 rounded-2xl p-4"
                            >
                                <View className="flex-row items-center justify-center">
                                    <MaterialIcons name="close" size={20} color="#fff" />
                                    <Text className="text-white font-semibold ml-2">Cancelar</Text>
                                </View>
                            </Pressable>
                        </View>
                    ) : (
                        <View className="mb-4">
                            <Pressable
                                onPress={limpiarFormulario}
                                className="bg-gray-100 rounded-2xl p-4"
                            >
                                <View className="flex-row items-center justify-center">
                                    <MaterialIcons name="refresh" size={20} color="#6B7280" />
                                    <Text className="text-gray-600 font-semibold ml-2">
                                        Limpiar
                                    </Text>
                                </View>
                            </Pressable>
                        </View>
                    )}

                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }} className="mb-4">
                        <Pressable
                            onPress={procesarPago}
                            className="bg-green-500 rounded-2xl p-4 shadow-lg"
                        >
                            <View className="flex-row items-center justify-center">
                                <MaterialIcons name="save" size={20} color="white" />
                                <Text className="text-white font-semibold ml-2">Guardar</Text>
                            </View>
                        </Pressable>
                    </Animated.View>
                </View>
            </View>
            <CustomAlert ref={alertRef} />
        </View>
    )
}

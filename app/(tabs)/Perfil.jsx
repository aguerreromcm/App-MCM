import { View, Text, Image, Pressable } from "react-native"
import { Feather, MaterialIcons } from "@expo/vector-icons"
import { router } from "expo-router"
import { COLORS, images } from "../../constants"
import { useSession } from "../../context/SessionContext"
import CustomAlert from "../../components/CustomAlert"
import { useCustomAlert } from "../../hooks/useCustomAlert"

export default function Perfil() {
    const { usuario, logout } = useSession()
    const { alertRef, showWarning, showSuccess, showError } = useCustomAlert()

    const cierraSesion = async () => {
        showWarning(
            "Cerrar Sesión",
            "¿Estás seguro que deseas cerrar sesión? Perderás el acceso a tu cuenta hasta que vuelvas a iniciar sesión.",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Cerrar Sesión",
                    onPress: async () => {
                        try {
                            const logoutSuccess = await logout()
                            if (logoutSuccess) {
                                showSuccess(
                                    "Sesión cerrada",
                                    "Has cerrado sesión exitosamente. ¡Hasta pronto!",
                                    [
                                        {
                                            text: "Aceptar",
                                            onPress: () => {
                                                // El layout de tabs se encargará de la redirección
                                            },
                                            style: "default"
                                        }
                                    ]
                                )
                            } else {
                                showError(
                                    "Error al cerrar sesión",
                                    "Ocurrió un problema al cerrar tu sesión. Por favor, inténtalo de nuevo."
                                )
                            }
                        } catch (_error) {
                            showError(
                                "Error inesperado",
                                "Ocurrió un error inesperado al cerrar la sesión. La aplicación se reiniciará."
                            )
                        }
                    },
                    style: "destructive"
                }
            ]
        )
    }

    return (
        <View className="flex-1">
            <View className="h-60 bg-primary">
                <View className="absolute top-36 self-center">
                    <Image
                        source={images.avatar}
                        className="w-28 h-28 rounded-full border-4 border-white"
                    />
                </View>
            </View>

            <View className="mt-16 items-center">
                <Text className="text-lg font-bold text-gray-900">
                    {usuario?.nombre || "Ejecutivo"}
                </Text>
                <View className="flex-row gap-1">
                    <Text className="text-sm font-semibold text-gray-700">Usuario:</Text>
                    <Text className="text-sm text-gray-700">
                        {usuario?.id_usuario || "Usuario"}
                    </Text>
                </View>

                <View className="flex-row gap-1">
                    <Text className="text-sm font-semibold text-gray-700">Región:</Text>
                    <Text className="text-sm text-gray-700">
                        {usuario?.region_base || "Región"}
                    </Text>
                </View>
                <View className="flex-row gap-1">
                    <Text className="text-sm font-semibold text-gray-700">Sucursal:</Text>
                    <Text className="text-sm text-gray-700">
                        {usuario?.sucursal_base || "Sucursal"}
                    </Text>
                </View>
            </View>

            <View className="flex-1 justify-center items-center px-8 py-12">
                {/* Botón Resumen Diario */}
                <Pressable
                    className="bg-blue-50 border border-blue-200 rounded-2xl px-8 py-4 flex-row items-center mb-6 w-full"
                    onPress={() => router.push("/(screens)/Resumen")}
                >
                    <MaterialIcons name="assessment" size={24} color="#2563eb" />
                    <Text className="text-blue-600 text-base font-medium ml-3">Resumen Diario</Text>
                </Pressable>

                {/* Botón Entregar Pagos */}
                <Pressable
                    className="bg-green-50 border border-green-200 rounded-2xl px-8 py-4 flex-row items-center mb-6 w-full"
                    onPress={() => router.push("/(screens)/SincronizarPagos")}
                >
                    <MaterialIcons name="sync" size={24} color="#16a34a" />
                    <Text className="text-green-600 text-base font-medium ml-3">
                        Sincronizar Pagos
                    </Text>
                </Pressable>

                {/* Botón Cerrar Sesión */}
                <Pressable
                    className="bg-red-50 border border-red-200 rounded-2xl px-8 py-4 flex-row items-center w-full"
                    onPress={cierraSesion}
                >
                    <Feather name="log-out" size={24} color={COLORS.error} />
                    <Text className="text-red-600 text-base font-medium ml-3">Cerrar Sesión</Text>
                </Pressable>
            </View>

            {/* Modal de alertas personalizadas */}
            <CustomAlert ref={alertRef} />
        </View>
    )
}

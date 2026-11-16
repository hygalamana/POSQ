
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm as useReactHookForm } from "react-hook-form";
import { useRouter } from '@/lib/routerCompat';
import toast from "react-hot-toast";
import { LogIn, AlertCircle, Eye, EyeOff } from "lucide-react";
import api from "../lib/api";
import { useAuthStore } from "../stores/authStore";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useReactHookForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      setServerError(null);
      const res = await api.post("/auth/login", data);
      const { user, accessToken, refreshToken } = res.data.data;
      
      setAuth(user, accessToken, refreshToken);
      toast.success(`Selamat datang, ${user.name}!`);
      router.push("/");
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || "Gagal masuk, periksa koneksi internet Anda";
      setServerError(errorMsg);
      toast.error(errorMsg);

      if (errorMsg.toLowerCase().includes("email")) {
        setError("email", { message: errorMsg });
      } else if (errorMsg.toLowerCase().includes("password")) {
        setError("password", { message: errorMsg });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-orange rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange/30">
            <span className="text-white font-black text-xl tracking-wider">PosQ</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Masuk ke <span className="text-orange">PosQ</span></h1>
          <p className="text-gray-500 text-sm mt-1">Sistem POS Terpadu</p>
        </div>

        {serverError && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              {...register("email")}
              onChange={() => setServerError(null)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.email ? "border-red focus:border-red" : "border-gray-200 focus:border-orange"
              } focus:outline-none transition-colors bg-gray-50 focus:bg-white`}
              placeholder="kasir@demo.com"
            />
            {errors.email && (
              <p className="text-red text-xs mt-1.5 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.email.message}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                onChange={() => setServerError(null)}
                className={`w-full px-4 py-3 pr-11 rounded-xl border ${
                  errors.password ? "border-red focus:border-red" : "border-gray-200 focus:border-orange"
                } focus:outline-none transition-colors bg-gray-50 focus:bg-white`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red text-xs mt-1.5 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.password.message}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange hover:bg-orange-dark text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-orange/20 disabled:opacity-70 disabled:active:scale-100"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Masuk</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

import habitacionalScript from "@/data/scripts/habitacional-script.json"
import hab532Script from "@/data/scripts/hab532-script.json"
import comercialScript from "@/data/scripts/comercial-script.json"
import ativoDesenrolaBrasilScript from "@/data/scripts/ativo_desenrola_Brasil-script.json"
import cartaoFase1Script from "@/data/scripts/cartao-fase1-script.json"
import cartaoFase2Script from "@/data/scripts/cartao-fase2-script.json"
import cbp01Kbp01Script from "@/data/scripts/CBP01_KBP01-script.json"
import cltConsignadoScript from "@/data/scripts/clt_consignado-script.json"
import cnpjComercialScript from "@/data/scripts/cnpj_comercial-script.json"
import cnpjHab532Script from "@/data/scripts/cnpj_hab532-script.json"
import cnpjHabitacionalScript from "@/data/scripts/cnpj_habitacional-script.json"
import cnpjProcred360Script from "@/data/scripts/cnpj_Procred360-script.json"
import comercialNovoScript from "@/data/scripts/comercial-novo-script.json"
import comercial228Script from "@/data/scripts/comercial228-script.json"
import exemploScript from "@/data/scripts/exemplo-script.json"
import hab110Script from "@/data/scripts/hab110-script.json"
import hab379Script from "@/data/scripts/hab379-script.json"
import hab527Script from "@/data/scripts/hab527-script.json"
import hab529Script from "@/data/scripts/hab529-script.json"
import hab531Script from "@/data/scripts/hab531-script.json"
import hab536Script from "@/data/scripts/hab536-script.json"
import habitacionalNovoScript from "@/data/scripts/habitacional-novo-script.json"
import receptivoDesenrolaBrasilScript from "@/data/scripts/receptivo_desenrola_Brasil-script.json"
import receptivoGeralScript from "@/data/scripts/receptivo-geral-script.json"
import reformaCasaBrasilScript from "@/data/scripts/reforma_casa_Brasil-script.json"

export const AUTO_LOAD_SCRIPTS = [
  habitacionalScript,
  hab532Script,
  comercialScript,
  ativoDesenrolaBrasilScript,
  cartaoFase1Script,
  cartaoFase2Script,
  cbp01Kbp01Script,
  cltConsignadoScript,
  cnpjComercialScript,
  cnpjHab532Script,
  cnpjHabitacionalScript,
  cnpjProcred360Script,
  comercialNovoScript,
  comercial228Script,
  exemploScript,
  hab110Script,
  hab379Script,
  hab527Script,
  hab529Script,
  hab531Script,
  hab536Script,
  habitacionalNovoScript,
  receptivoDesenrolaBrasilScript,
  receptivoGeralScript,
  reformaCasaBrasilScript,
]

export function getAutoLoadScripts() {
  return AUTO_LOAD_SCRIPTS
}

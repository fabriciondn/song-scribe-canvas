import { supabase } from '@/integrations/supabase/client';

export interface RaffleSettings {
  id: string;
  name: string;
  description: string | null;
  total_numbers: number;
  min_number: number;
  max_number: number;
  is_active: boolean;
  is_visible_in_menu: boolean;
  draw_date: string | null;
  prize_description: string | null;
  prize_image_url: string | null;
  rules: string | null;
  base_numbers_for_pro: number;
  numbers_per_credit: number;
  created_at: string;
  updated_at: string;
}

export interface RaffleReservation {
  id: string;
  raffle_id: string;
  user_id: string;
  number: number;
  reserved_at: string;
}

export const raffleService = {
  // Buscar configurações do sorteio ativo
  async getActiveRaffle(): Promise<RaffleSettings | null> {
    const { data, error } = await supabase
      .from('raffle_settings')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar sorteio:', error);
      throw error;
    }
    
    return data as RaffleSettings | null;
  },

  // Buscar todas as reservas de um sorteio
  async getReservations(raffleId: string): Promise<RaffleReservation[]> {
    const { data, error } = await supabase
      .from('raffle_reservations')
      .select('*')
      .eq('raffle_id', raffleId)
      .order('number', { ascending: true });
    
    if (error) throw error;
    return data as RaffleReservation[];
  },

  // Buscar reservas do usuário atual
  async getUserReservations(raffleId: string, userId: string): Promise<RaffleReservation[]> {
    const { data, error } = await supabase
      .from('raffle_reservations')
      .select('*')
      .eq('raffle_id', raffleId)
      .eq('user_id', userId)
      .order('number', { ascending: true });
    
    if (error) throw error;
    return data as RaffleReservation[];
  },

  // Reservar um número
  async reserveNumber(raffleId: string, userId: string, number: number): Promise<RaffleReservation> {
    const { data, error } = await supabase
      .from('raffle_reservations')
      .insert([{
        raffle_id: raffleId,
        user_id: userId,
        number
      }])
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') {
        throw new Error('Este número já foi reservado');
      }
      throw error;
    }
    
    return data as RaffleReservation;
  },

  // Cancelar reserva de um número
  async cancelReservation(reservationId: string): Promise<void> {
    const { error } = await supabase
      .from('raffle_reservations')
      .delete()
      .eq('id', reservationId);
    
    if (error) throw error;
  },

  // Verificar se o sorteio está visível no menu
  async isRaffleVisibleInMenu(): Promise<boolean> {
    const { data, error } = await supabase
      .from('raffle_settings')
      .select('is_visible_in_menu')
      .eq('is_active', true)
      .limit(1)
      .single();
    
    if (error) return false;
    return data?.is_visible_in_menu ?? false;
  }
};

-- ============================================================================
-- Migration: Update 34 DAO Tasks with v3.0 CGC Classification Values
-- Date: 2025-12-20
-- Author: Claude Code + Godez22
-- ============================================================================
--
-- SISTEMA DE CLASIFICACIÓN v3.0:
-- - Complexity 3:    500 CGC (Simple)
-- - Complexity 4:    700 CGC (Simple)
-- - Complexity 5:  1,000 CGC (Medium)
-- - Complexity 6:  1,400 CGC (Medium)
-- - Complexity 7:  2,000 CGC (High)
-- - Complexity 8:  2,750 CGC (High)
-- - Complexity 9:  5,000 CGC (Critical)
-- - Complexity 10: 10,000 CGC (Epic)
--
-- TOTAL ANTERIOR: 4,100 CGC
-- TOTAL NUEVO:   59,850 CGC (+1,360%)
-- ============================================================================

-- Complexity 3 → 500 CGC (Simple)
UPDATE tasks SET reward_cgc = 500.00, updated_at = NOW() WHERE task_id = 'DAO-026';

-- Complexity 4 → 700 CGC (Simple)
UPDATE tasks SET reward_cgc = 700.00, updated_at = NOW() WHERE task_id IN (
  'DAO-009', 'DAO-016', 'DAO-019', 'DAO-022', 'DAO-023'
);

-- Complexity 5 → 1,000 CGC (Medium)
UPDATE tasks SET reward_cgc = 1000.00, updated_at = NOW() WHERE task_id IN (
  'DAO-005', 'DAO-014', 'DAO-017', 'DAO-020', 'DAO-021', 'DAO-033'
);

-- Complexity 6 → 1,400 CGC (Medium)
UPDATE tasks SET reward_cgc = 1400.00, updated_at = NOW() WHERE task_id IN (
  'DAO-002', 'DAO-008', 'DAO-012', 'DAO-015', 'DAO-018', 'DAO-024', 'DAO-031', 'DAO-034'
);

-- Complexity 7 → 2,000 CGC (High)
UPDATE tasks SET reward_cgc = 2000.00, updated_at = NOW() WHERE task_id IN (
  'DAO-004', 'DAO-010', 'DAO-013', 'DAO-028', 'DAO-030'
);

-- Complexity 8 → 2,750 CGC (High)
UPDATE tasks SET reward_cgc = 2750.00, updated_at = NOW() WHERE task_id IN (
  'DAO-001', 'DAO-006', 'DAO-011', 'DAO-025', 'DAO-029'
);

-- Complexity 9 → 5,000 CGC (Critical)
UPDATE tasks SET reward_cgc = 5000.00, updated_at = NOW() WHERE task_id IN (
  'DAO-003', 'DAO-007', 'DAO-027', 'DAO-032'
);

-- ============================================================================
-- RESUMEN DE ACTUALIZACIONES
-- ============================================================================
--
-- | Task ID  | Complejidad | Valor Antiguo | Valor Nuevo | Cambio   |
-- |----------|-------------|---------------|-------------|----------|
-- | DAO-001  | 8 (High)    | 150 CGC       | 2,750 CGC   | +1,733%  |
-- | DAO-002  | 6 (Medium)  | 120 CGC       | 1,400 CGC   | +1,067%  |
-- | DAO-003  | 9 (Critical)| 180 CGC       | 5,000 CGC   | +2,678%  |
-- | DAO-004  | 7 (High)    | 140 CGC       | 2,000 CGC   | +1,329%  |
-- | DAO-005  | 5 (Medium)  | 100 CGC       | 1,000 CGC   | +900%    |
-- | DAO-006  | 8 (High)    | 160 CGC       | 2,750 CGC   | +1,619%  |
-- | DAO-007  | 9 (Critical)| 200 CGC       | 5,000 CGC   | +2,400%  |
-- | DAO-008  | 6 (Medium)  | 120 CGC       | 1,400 CGC   | +1,067%  |
-- | DAO-009  | 4 (Simple)  | 80 CGC        | 700 CGC     | +775%    |
-- | DAO-010  | 7 (High)    | 130 CGC       | 2,000 CGC   | +1,438%  |
-- | DAO-011  | 8 (High)    | 150 CGC       | 2,750 CGC   | +1,733%  |
-- | DAO-012  | 6 (Medium)  | 110 CGC       | 1,400 CGC   | +1,173%  |
-- | DAO-013  | 7 (High)    | 140 CGC       | 2,000 CGC   | +1,329%  |
-- | DAO-014  | 5 (Medium)  | 100 CGC       | 1,000 CGC   | +900%    |
-- | DAO-015  | 6 (Medium)  | 120 CGC       | 1,400 CGC   | +1,067%  |
-- | DAO-016  | 4 (Simple)  | 90 CGC        | 700 CGC     | +678%    |
-- | DAO-017  | 5 (Medium)  | 100 CGC       | 1,000 CGC   | +900%    |
-- | DAO-018  | 6 (Medium)  | 110 CGC       | 1,400 CGC   | +1,173%  |
-- | DAO-019  | 4 (Simple)  | 80 CGC        | 700 CGC     | +775%    |
-- | DAO-020  | 5 (Medium)  | 90 CGC        | 1,000 CGC   | +1,011%  |
-- | DAO-021  | 5 (Medium)  | 100 CGC       | 1,000 CGC   | +900%    |
-- | DAO-022  | 4 (Simple)  | 80 CGC        | 700 CGC     | +775%    |
-- | DAO-023  | 4 (Simple)  | 90 CGC        | 700 CGC     | +678%    |
-- | DAO-024  | 6 (Medium)  | 120 CGC       | 1,400 CGC   | +1,067%  |
-- | DAO-025  | 8 (High)    | 160 CGC       | 2,750 CGC   | +1,619%  |
-- | DAO-026  | 3 (Simple)  | 60 CGC        | 500 CGC     | +733%    |
-- | DAO-027  | 9 (Critical)| 180 CGC       | 5,000 CGC   | +2,678%  |
-- | DAO-028  | 7 (High)    | 130 CGC       | 2,000 CGC   | +1,438%  |
-- | DAO-029  | 8 (High)    | 150 CGC       | 2,750 CGC   | +1,733%  |
-- | DAO-030  | 7 (High)    | 140 CGC       | 2,000 CGC   | +1,329%  |
-- | DAO-031  | 6 (Medium)  | 110 CGC       | 1,400 CGC   | +1,173%  |
-- | DAO-032  | 9 (Critical)| 200 CGC       | 5,000 CGC   | +2,400%  |
-- | DAO-033  | 5 (Medium)  | 100 CGC       | 1,000 CGC   | +900%    |
-- | DAO-034  | 6 (Medium)  | 120 CGC       | 1,400 CGC   | +1,067%  |
-- |----------|-------------|---------------|-------------|----------|
-- | TOTAL    |             | 4,100 CGC     | 59,850 CGC  | +1,360%  |
-- ============================================================================

-- Verificación: mostrar resumen
SELECT
  complexity,
  COUNT(*) as num_tasks,
  SUM(reward_cgc) as total_cgc
FROM tasks
WHERE task_id LIKE 'DAO-%'
GROUP BY complexity
ORDER BY complexity;

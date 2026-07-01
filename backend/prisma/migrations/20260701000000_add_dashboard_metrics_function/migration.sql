CREATE OR REPLACE FUNCTION get_dashboard_metrics(ai_agent_email text)
RETURNS json AS $$
DECLARE
  v_ai_agent_id text;
  v_total_tickets int;
  v_open_tickets int;
  v_ai_resolved int;
  v_percent_ai_resolved numeric;
  v_avg_resolution_seconds numeric;
  v_avg_resolution_hours numeric;
  v_daily_tickets json;
  v_result json;
BEGIN
  -- 1. Get AI Agent ID
  SELECT id INTO v_ai_agent_id FROM "user" WHERE email = ai_agent_email;
  IF v_ai_agent_id IS NULL THEN
    v_ai_agent_id := 'NO_AI_AGENT';
  END IF;

  -- 2. Basic counts
  SELECT count(*) INTO v_total_tickets FROM "ticket";
  SELECT count(*) INTO v_open_tickets FROM "ticket" WHERE status = 'OPEN';
  SELECT count(*) INTO v_ai_resolved FROM "ticket" WHERE status = 'RESOLVED' AND "assignedToId" = v_ai_agent_id;

  IF v_total_tickets = 0 THEN
    v_percent_ai_resolved := 0;
  ELSE
    v_percent_ai_resolved := ROUND((v_ai_resolved::numeric / v_total_tickets::numeric) * 100, 1);
  END IF;

  -- 3. Avg resolution time
  SELECT AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))) INTO v_avg_resolution_seconds
  FROM "ticket"
  WHERE status IN ('RESOLVED', 'CLOSED');

  IF v_avg_resolution_seconds IS NULL THEN
    v_avg_resolution_seconds := 0;
  END IF;
  v_avg_resolution_hours := ROUND((v_avg_resolution_seconds / 3600)::numeric, 1);

  -- 4. Daily tickets (last 30 days including 0s)
  SELECT json_agg(
    json_build_object(
      'date', to_char(d.date, 'YYYY-MM-DD'),
      'count', COALESCE(t.count, 0)
    )
  ) INTO v_daily_tickets
  FROM (
    SELECT generate_series(
      CURRENT_DATE - INTERVAL '29 days', 
      CURRENT_DATE, 
      '1 day'::interval
    )::date as date
  ) d
  LEFT JOIN (
    SELECT DATE("createdAt") as date, count(*) as count
    FROM "ticket"
    WHERE "createdAt" >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE("createdAt")
  ) t ON d.date = t.date;

  -- 5. Build result
  v_result := json_build_object(
    'totalTickets', v_total_tickets,
    'openTickets', v_open_tickets,
    'aiResolved', v_ai_resolved,
    'percentAiResolved', v_percent_ai_resolved,
    'avgResolutionHours', v_avg_resolution_hours || 'h',
    'dailyTickets', COALESCE(v_daily_tickets, '[]'::json)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

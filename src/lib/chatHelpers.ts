/**
 * Chat Helper Functions
 * Utility functions for the chat interface
 */

/**
 * Convert technical tool names to user-friendly action descriptions
 */
export const getToolFriendlyName = (toolName: string): string => {
    const toolMap: Record<string, string> = {
        'describe_business': 'a registar o seu negócio',
        'get_business_info': 'a obter informações do negócio',
        'update_business': 'a atualizar o negócio',
        'run_market_research': 'a fazer pesquisa de mercado',
        'get_market_research': 'a obter pesquisa de mercado',
        'run_strategic_plan': 'a criar plano estratégico',
        'get_strategic_plan': 'a obter plano estratégico',
        'generate_campaign': 'a criar campanha de marketing',
        'list_campaigns': 'a listar campanhas',
        'get_campaign': 'a obter detalhes da campanha',
        'generate_content': 'a gerar conteúdo',
        'generate_campaign_contents': 'a gerar conteúdos da campanha',
        'generate_campaign_images': 'a gerar imagens da campanha',
        'generate_campaign_videos': 'a gerar vídeos da campanha',
        'list_campaign_contents': 'a listar conteúdos da campanha',
        'list_all_business_content': 'a listar todos os conteúdos',
        'list_generated_content': 'a listar conteúdos gerados',
        'get_drive_links': 'a obter links do Google Drive',
    };

    return toolMap[toolName] || `a executar ${toolName.replace(/_/g, ' ')}`;
};

/**
 * Remove MongoDB ObjectIds and other technical IDs from text
 */
export const sanitizeContent = (content: string): string => {
    if (!content) return content;

    // Remove internal SYSTEM messages (like User ID injection)
    let sanitized = content.replace(/\[SYSTEM:[^\]]*\]/, '');

    // Remove MongoDB ObjectId patterns: (ID: 507f1f77bcf86cd799439011)
    sanitized = sanitized.replace(/\(ID:\s*[a-f0-9]{24}\s*\)/gi, '');

    // Remove standalone ObjectIds in parentheses
    sanitized = sanitized.replace(/\([a-f0-9]{24}\)/g, '');

    // Remove "ID: xxx" patterns
    sanitized = sanitized.replace(/ID:\s*[a-f0-9]{24}/gi, '');

    // Clean up any double spaces left behind (but preserve newlines)
    sanitized = sanitized.replace(/[ \t]{2,}/g, ' ');

    return sanitized.trim();
};
